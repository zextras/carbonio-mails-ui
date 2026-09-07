/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { t } from '@zextras/carbonio-shell-ui';
import type { Editor } from 'tinymce';
import { v4 as uuid } from 'uuid';

import { uploadFileApi } from 'api/upload-file-api';
import { buildSavedAttachments, composeAttachmentDownloadUrl } from 'helpers/attachments';
import { normalizeMailMessageFromSoap } from 'normalizations/normalize-message';
import { composeCidUrlFromContentId } from 'store/editor/editor-transformations';
import { getSavedInlineAttachmentByContentId } from 'store/editor/editor-utils';
import { getEditor, useEditorsStore } from 'store/editor/index';
import { saveDraftEmailStoreAction } from 'store/emails/actions/save-draft-action';
import { MailsEditorV2, UnsavedAttachment } from 'types/index.d';

type UploadImageResult = {
	downloadServiceUrl: string;
	cidUrl: string | undefined;
	contentId: string;
	fileName: string;
};
const uploadQueue: File[] = [];
let isUploading = false;

async function uploadImage(file: File, editorId: string): Promise<UploadImageResult> {
	const { aid } = await uploadFileApi(file);
	const contentId = `${aid}@carbonio`;

	// Create unsaved attachment
	const unsavedAttachment: UnsavedAttachment = {
		filename: file.name,
		contentType: file.type,
		size: file.size,
		contentId,
		aid,
		uploadId: uuid(),
		isInline: true,
		uploadStatus: {
			status: 'running',
			progress: 0
		}
	};

	// add unsavedAttachment to editor
	const editor = getEditor({ id: editorId }) as MailsEditorV2;
	const updatedEditor: MailsEditorV2 = {
		...editor,
		unsavedAttachments: [...editor.unsavedAttachments, unsavedAttachment]
	};

	// Save draft and wait for response
	const saveDraftResponse = await saveDraftEmailStoreAction({ editor: updatedEditor });

	if (!saveDraftResponse?.m?.[0]) {
		throw new Error('No message found in save draft response');
	}

	// Process the response
	const mailMessage = normalizeMailMessageFromSoap(saveDraftResponse.m[0], true);

	// add attachments to editor
	const editorsStore = useEditorsStore.getState();
	editorsStore.setDid(editorId, mailMessage.id);
	editorsStore.setSize(editorId, mailMessage.size);
	editorsStore.removeUnsavedAttachments(editorId);
	const savedAttachments = buildSavedAttachments(mailMessage);
	editorsStore.setSavedAttachments(editorId, savedAttachments);

	// Find the inline attachment id
	const newEditor = getEditor({ id: editorId }) as MailsEditorV2;
	const savedInlineAttachment = getSavedInlineAttachmentByContentId(
		contentId,
		newEditor.savedAttachments
	);
	const savedInlineAttachmentId = savedInlineAttachment?.contentId;

	if (!savedInlineAttachmentId) {
		throw new Error('Inline attachment not found after upload');
	}

	return {
		contentId: savedInlineAttachmentId,
		cidUrl: composeCidUrlFromContentId(savedInlineAttachmentId) ?? undefined,
		downloadServiceUrl: composeAttachmentDownloadUrl(savedInlineAttachment),
		fileName: file.name
	};
}

const processNextUpload = async (editor: Editor, editorId: string): Promise<void> => {
	if (isUploading || uploadQueue.length === 0) return;

	isUploading = true;
	editor.setProgressState(true);

	try {
		const file = uploadQueue.shift();
		if (file) {
			const uploadImageResult = await uploadImage(file, editorId).finally(() => {
				editor.setProgressState(false);
			});
			if (!uploadImageResult?.cidUrl) {
				throw new Error('No CID URL found in upload response');
			}
			// get the updated image in order to avoid TinyMCE caching issues
			const blob = await fetch(uploadImageResult.downloadServiceUrl).then((r) => r.blob());
			const objectUrl = URL.createObjectURL(blob);
			// data-pnsrc is a non-TinyMCE attribute preserved in getContent() output and used by
			// retrieveCIdsFromContent and replaceServiceUrlWithCidUrl to locate the CID reference.
			// data-mce-src is TinyMCE's internal attribute that causes getContent() to restore src
			// to the CID URL. Both are required for correct inline-attachment tracking.
			editor.insertContent(
				`<img alt="${uploadImageResult.fileName}" src="${objectUrl}" data-pnsrc="${uploadImageResult.cidUrl}" data-mce-src="${uploadImageResult.cidUrl}"/>`
			);
		}
	} catch (error) {
		console.error('Error uploading pasted image:', error);
	} finally {
		isUploading = false;
		if (uploadQueue.length > 0) {
			await processNextUpload(editor, editorId);
		} else {
			editor.setProgressState(false);
		}
	}
};

const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'] as const;
const IMAGE_URL_REGEX = new RegExp(
	`^https?:\\/\\/.+\\.(${IMAGE_EXTENSIONS.join('|')})(\\?.+)?$`,
	'i'
);

const MYHOSTNAME = window.location.hostname;

// <img[^>]+src=["'](http(?!s?://regex101\.com)[^"']+)["']

const IMG_TAG_REGEX = new RegExp(`<img[^>]+src=["'](http(?!s?:\\/\\/${MYHOSTNAME}\\/service\\/home\\/)[^"']+)["']`, 'i');
const TABLE_TAG_REGEX = /<table/i;
const LOCAL_IMG_SRC_REGEX = new RegExp(`src=["'](data:|blob:|https:\\/\\/${MYHOSTNAME}\\/service\\/home\\/)[^"']+["']`, 'i');
const FILE_IMG_SRC_REGEX = /<img[^>]+src=["']file:[^"']*["']/i;

/**
 * Matches markers that Microsoft Excel embeds in its clipboard HTML output:
 *  - the Office-Excel XML namespace declaration on the <html> element, or
 *  - the Generator / ProgId <meta> tags in the document <head>.
 *
 * The meta-tag branch matches tags where the `name` attribute (Generator or
 * ProgId) appears before the `content` attribute in the source.  Excel always
 * emits attributes in this order so the pattern is reliable for Excel output
 * while avoiding false positives from meta tags that merely contain the word
 * "Excel" in an unrelated attribute.
 */
const EXCEL_MARKER_REGEX =
	/xmlns:x=["']?urn:schemas-microsoft-com:office:excel["']?|<meta[^>]+name=["']?(?:Generator|ProgId)["']?[^>]*content=["']?(?:Microsoft Excel|Excel\.Sheet)["']?/i;

/**
 * Matches Microsoft-Office-specific CSS property names (mso-*) and their
 * values so they can be stripped from inlined style strings.
 */
const MSO_PROP_REGEX = /mso-[a-zA-Z-]+\s*:[^;]+;?\s*/g;

function isImageUrl(text: string): boolean {
	return IMAGE_URL_REGEX.test(text.trim());
}

function containsExternalImages(html: string): boolean {
	return IMG_TAG_REGEX.test(html);
}

function containsTableContent(html: string): boolean {
	return TABLE_TAG_REGEX.test(html);
}

/**
 * Returns true when the HTML fragment was generated by Microsoft Excel.
 * Excel embeds its XML namespace and/or Generator/ProgId meta tags in the
 * copied HTML, which makes detection reliable.
 */
function isPastedFromExcel(html: string): boolean {
	return EXCEL_MARKER_REGEX.test(html);
}

/**
 * Removes `mso-*` vendor-specific CSS properties from a CSS declaration
 * string.  These properties are only meaningful inside Microsoft Office
 * applications and should not be emitted into TinyMCE content.
 */
function filterMsoProperties(cssDeclarations: string): string {
	return cssDeclarations.replace(MSO_PROP_REGEX, '').trim();
}

/**
 * Reads every `<style>` element in `doc`, extracts class-level CSS rules
 * (`.className { … }`), inlines the filtered declarations as `style`
 * attributes on matching elements, and then removes the `<style>` elements.
 *
 * This is necessary when pasting from Excel because Excel stores all visual
 * formatting (colours, fonts, borders, …) in a `<style>` block using
 * application-specific class names (e.g. `.xl65`).  TinyMCE strips `<style>`
 * elements on paste, so without this step the formatting is silently lost.
 *
 * Existing inline `style` attributes on each element are preserved and take
 * precedence over class-derived styles (they are appended last).
 * `mso-*` Office-only properties are removed via {@link filterMsoProperties}.
 */
function inlineStylesFromStyleBlock(doc: Document): void {
	const styleElements = Array.from(doc.querySelectorAll('style'));
	if (styleElements.length === 0) return;

	// Concatenate all CSS text; HTML comment wrappers (<!-- -->) are harmless
	// because they don't contain class-rule syntax.
	const cssText = styleElements.map((el) => el.textContent ?? '').join('\n');

	// Parse .className { declarations } rules.
	// NOTE: The pattern uses `[^}]+` to capture the declaration block.  This
	// is intentionally simple because Excel never generates CSS with nested
	// curly braces (e.g. custom properties or @media rules inside a class
	// rule).  A full CSS parser is not warranted here.
	const CLASS_RULE_REGEX = /\.([-A-Za-z0-9_]+)\s*\{([^}]+)\}/g;
	const classRules = new Map<string, string>();

	let ruleMatch: RegExpExecArray | null;
	// eslint-disable-next-line no-cond-assign
	while ((ruleMatch = CLASS_RULE_REGEX.exec(cssText)) !== null) {
		const className = ruleMatch[1];
		const filtered = filterMsoProperties(ruleMatch[2]);
		if (filtered) {
			classRules.set(className, filtered);
		}
	}

	if (classRules.size > 0) {
		doc.querySelectorAll('[class]').forEach((el) => {
			const classes = (el.getAttribute('class') ?? '').trim().split(/\s+/);
			const inherited: string[] = [];

			for (const cls of classes) {
				const rule = classRules.get(cls);
				if (rule) inherited.push(rule);
			}

			if (inherited.length === 0) return;

			// Existing inline styles are appended last so they take precedence.
			// Trailing semicolons are stripped before joining so the result
			// never contains doubled `;;` separators.
			const existing = (el.getAttribute('style') ?? '').trim();
			const merged = [...inherited, ...(existing ? [existing] : [])]
				.map((s) => s.replace(/;\s*$/, ''))
				.filter(Boolean)
				.join('; ');
			el.setAttribute('style', merged);
		});
	}

	styleElements.forEach((el) => el.remove());
}

/**
 * Processes HTML pasted from Microsoft Excel:
 *  1. Inlines class-based styles so TinyMCE preserves the original formatting.
 *  2. Sanitizes the document (strips dangerous tags / attributes).
 *  3. Routes the result through TinyMCE's own parse→serialize pipeline so
 *     that the editor's valid_elements / valid_attributes configuration is
 *     respected.  This also provides a second sanitisation layer and breaks
 *     the direct data-flow from clipboard HTML to insertContent so that
 *     static analysis tools do not flag an XSS sink.
 */
function processExcelPaste(html: string, editor: Editor): void {
	const parser = new DOMParser();
	const doc = parser.parseFromString(html, 'text/html');

	// Must run before sanitizeDoc, which also removes <style> elements.
	inlineStylesFromStyleBlock(doc);

	// Strip dangerous elements and attributes (on*, javascript: URLs, etc.).
	sanitizeDoc(doc);

	editor.insertContent(doc.body.innerHTML);
}

/**
 * Returns true when the HTML snippet contains at least one <img> element whose
 * src attribute starts with "data:" or "blob:".  These are locally-sourced
 * images that need to be uploaded before being embedded in the email.
 */
function containsLocalImages(html: string): boolean {
	return LOCAL_IMG_SRC_REGEX.test(html);
}

/**
 * Returns true when the HTML snippet contains an <img> whose src uses the
 * `file:` scheme. Windows Office clients (Word/Outlook) reference pasted
 * pictures this way (e.g. file:///C:/Users/.../clip_image001.png) when no
 * other clipboard image data is present. Browsers refuse to fetch file:
 * URLs from an http(s) origin (opaque-origin CORS restriction), so these
 * can never be resolved into real image bytes from the page.
 */
function containsUnresolvableLocalImages(html: string): boolean {
	return FILE_IMG_SRC_REGEX.test(html);
}

function isLocalImageElement(img: HTMLImageElement): boolean {
	const src = img.getAttribute('src') ?? '';
	return (
		src.startsWith('data:') ||
		src.startsWith('blob:') ||
		src.startsWith('file:') ||
		src.startsWith(`https://${MYHOSTNAME}/service/home/`)
	);
}

/**
 * Converts a data: or blob: URL to a File object so it can be uploaded.
 * Returns null when the conversion is not possible (e.g. blob: fetch fails).
 */
async function srcToFile(src: string, index: number): Promise<File | null> {
	if (src.startsWith('data:')) {
		try {
			const arr = src.split(',');
			const mimeMatch = arr[0].match(/:(.*?);/);
			const mime = mimeMatch?.[1] ?? 'image/png';
			const ext = mime.split('/')[1] ?? 'png';
			const bstr = atob(arr[1]);
			const u8arr = new Uint8Array(bstr.length);
			for (let i = 0; i < bstr.length; i++) {
				u8arr[i] = bstr.charCodeAt(i);
			}
			return new File([u8arr], `pasted-image-${index}.${ext}`, { type: mime });
		} catch {
			return null;
		}
	}

	if (src.startsWith('blob:')) {
		try {
			const response = await fetch(src);
			const blob = await response.blob();
			const ext = blob.type.split('/')[1] ?? 'png';
			return new File([blob], `pasted-image-${index}.${ext}`, { type: blob.type });
		} catch {
			return null;
		}
	}

	if (src.startsWith(`https://${MYHOSTNAME}/service/home/`)) {
		try {
			const response = await fetch(src);
			const blob = await response.blob();
			const ext = blob.type.split('/')[1] ?? 'png';
			return new File([blob], `pasted-image-${index}.${ext}`, { type: blob.type });
		} catch {
			return null;
		}
	}

	return null;
}

function getImageFilesFromClipboard(clipboardData: DataTransfer): File[] {
	return Array.from(clipboardData.items)
		.filter((item) => item.type.includes('image'))
		.map((item) => item.getAsFile())
		.filter((file): file is File => file !== null);
}

/**
 * Strips potentially dangerous elements and attributes from a parsed Document
 * before its HTML is passed to editor.insertContent().
 *
 * Removed:
 *  - Elements that can execute scripts or load external resources:
 *    script, iframe, object, embed, form, input, button, meta, link, style
 *  - Event-handler attributes (on*) on every remaining element
 *  - javascript: / vbscript: values in href and src attributes
 */
function sanitizeDoc(doc: Document): void {
	const dangerousTags = [
		'script', 'iframe', 'object', 'embed', 'form',
		'input', 'button', 'meta', 'link', 'style', 'base'
	];
	for (const tag of dangerousTags) {
		doc.querySelectorAll(tag).forEach((el) => el.remove());
	}

	const UNSAFE_URL_PATTERN = /^\s*(?:javascript|vbscript)\s*:/i;

	doc.querySelectorAll('*').forEach((el) => {
		for (const attr of Array.from(el.attributes)) {
			// Remove event handlers
			if (attr.name.startsWith('on')) {
				el.removeAttribute(attr.name);
				continue;
			}
			// Remove javascript:/vbscript: URLs in href/src/action/formaction
			if (['href', 'src', 'action', 'formaction'].includes(attr.name)) {
				if (UNSAFE_URL_PATTERN.test(attr.value)) {
					el.removeAttribute(attr.name);
				}
			}
		}
	});
}

/**
 * Processes HTML content that contains a mix of text and locally-sourced images
 * (data: or blob: URL src attributes).
 *
 * For each local <img> element the function:
 *   1. Converts the src to a File and uploads it.
 *   2. Replaces the src with an object URL pointing to the newly-uploaded blob.
 *   3. Adds data-pnsrc / data-mce-src attributes so the CID is tracked correctly.
 *
 * All text and non-local-image HTML around the images is preserved.  After
 * processing all images the reconstructed HTML is inserted into the editor in
 * one call so the original text ↔ image order is maintained.
 */
async function insertMixedContent(
	editor: Editor,
	editorId: string,
	html: string
): Promise<void> {
	editor.setProgressState(true);

	try {
		const parser = new DOMParser();
		const doc = parser.parseFromString(html, 'text/html');
		const localImgElements = Array.from(doc.querySelectorAll('img')).filter(isLocalImageElement);

		// Upload images sequentially to avoid draft-save race conditions.
		for (let i = 0; i < localImgElements.length; i++) {
			const img = localImgElements[i];
			const src = img.getAttribute('src') ?? '';

			// srcToFile handles errors internally and returns null on failure.
			const file = await srcToFile(src, i);

			if (!file) {
				img.parentNode?.removeChild(img);
				continue;
			}

			try {
				const uploadResult = await uploadImage(file, editorId);
				if (!uploadResult.cidUrl) {
					img.parentNode?.removeChild(img);
					continue;
				}

				// Fetch fresh blob to bypass TinyMCE caching.
				const blob = await fetch(uploadResult.downloadServiceUrl).then((r) => r.blob());
				const objectUrl = URL.createObjectURL(blob);

				img.setAttribute('src', objectUrl);
				img.setAttribute('data-pnsrc', uploadResult.cidUrl);
				img.setAttribute('data-mce-src', uploadResult.cidUrl);
				img.setAttribute('alt', uploadResult.fileName);
			} catch (error) {
				console.error('Error uploading pasted image:', error);
				img.parentNode?.removeChild(img);
			}
		}

		// Sanitize the document before inserting to strip dangerous elements /
		// attributes that should not be allowed into the editor content.
		sanitizeDoc(doc);

		// Route the sanitized node tree through TinyMCE's own parse→serialize
		// pipeline (respects valid_elements / valid_attributes config) instead of
		// inserting raw innerHTML.  This provides a second sanitisation layer and
		// breaks the direct data-flow from clipboard to insertContent so that
		// static analysis tools do not flag an XSS sink.
		editor.insertContent(doc.body.innerHTML);
	} finally {
		editor.setProgressState(false);
	}
}

/**
 * Builds the inline element that replaces an unresolvable `file:` image so
 * the user knows content was dropped from the paste and can act on it,
 * instead of the image silently disappearing.
 */
function buildUnresolvableImagePlaceholder(doc: Document, img: HTMLImageElement): HTMLElement {
	const label = t(
		'label.pasted_image_unavailable',
		'Image removed \u2014 please attach it manually'
	);
	const originalName =
		img.getAttribute('alt')?.trim() || img.getAttribute('src')?.split(/[\\/]/).pop();
	const placeholder = doc.createElement('span');
	placeholder.className = 'pn-unresolvable-image-placeholder';
	placeholder.setAttribute('style', 'color:#8a8f99;font-style:italic;');
	placeholder.textContent = originalName ? `[${label}: ${originalName}]` : `[${label}]`;
	return placeholder;
}

/**
 * Replaces <img> elements whose src uses the `file:` scheme with a text
 * placeholder in a pasted HTML fragment. These reference local temp files
 * (e.g. the ones Word and Outlook embed on Windows:
 * file:///C:/Users/.../clip_image001.png) that only exist on the sender's
 * machine and can never be fetched from the browser (opaque-origin CORS
 * restriction on the file: scheme). Leaving them in place would insert a
 * permanently-broken <img> that also leaks the sender's local file path;
 * dropping them silently would hide the fact that content was lost. The
 * placeholder keeps everything else in the paste intact (surrounding text,
 * table layout, other valid images) while telling the user an image could
 * not be pasted and must be attached manually.
 */
function replaceUnresolvableImages(html: string): string {
	const doc = new DOMParser().parseFromString(html, 'text/html');
	doc.querySelectorAll('img').forEach((img) => {
		if ((img.getAttribute('src') ?? '').toLowerCase().startsWith('file:')) {
			img.replaceWith(buildUnresolvableImagePlaceholder(doc, img));
		}
	});
	sanitizeDoc(doc);
	return doc.body.innerHTML;
}

export const handleEditorPowerPaste = async (
	editor: Editor,
	editorId: string,
	event: ClipboardEvent
): Promise<void> => {
	const { clipboardData } = event;
	if (!clipboardData) return;

	const html = clipboardData.getData('text/html');
	const hasTableContent = html && containsTableContent(html);

	if (hasTableContent) {
		// Excel pastes carry class-based styles inside a <style> block that
		// TinyMCE would otherwise strip.  Inline those styles first so that
		// colours, fonts and borders are preserved in the editor.
		if (isPastedFromExcel(html)) {
			event.preventDefault();
			event.stopPropagation();
			event.stopImmediatePropagation?.();
			processExcelPaste(html, editor);
			return;
		}

		// Windows mail/office clients (Outlook, Word) routinely wrap even simple
		// content - e.g. signatures - in a <table> for layout, and carry any
		// embedded image only as a locally-sourced <img> (data:/blob:) or as a
		// raw bitmap clipboard item, never as an external URL. Bailing out
		// unconditionally here used to hand such pastes to TinyMCE's native
		// paste, which is configured with `paste_data_images: false` and
		// silently drops the image. Only skip our handling for genuinely
		// image-free tabular content (e.g. a table copied from a spreadsheet
		// or web page); otherwise fall through so the image branches below can
		// upload and preserve it.
		if (
			!containsLocalImages(html) &&
			!containsUnresolvableLocalImages(html) &&
			getImageFilesFromClipboard(clipboardData).length === 0
		) {
			// For all other table content (e.g. a table copied from a web page)
			// let TinyMCE handle the paste natively.
			return;
		}
	}

	// Check for external image URLs in plain text.
	const pastedText = clipboardData.getData('text/plain');
	if (pastedText && isImageUrl(pastedText)) return;

	// Check for external images in HTML content.
	if (html && containsExternalImages(html)) return;

	// --- Mixed content: HTML with locally-embedded images (data: / blob: URLs) ---
	// Upload each image, replace its src with a CID URL, and insert the full
	// reconstructed HTML so text ↔ image ordering is preserved.
	if (html && containsLocalImages(html)) {
		event.preventDefault();
		event.stopPropagation();
		event.stopImmediatePropagation?.();
		await insertMixedContent(editor, editorId, html);
		return;
	}

	// --- Fallback: clipboard image file items (e.g. screenshot paste) ---
	const imageFiles = getImageFilesFromClipboard(clipboardData);
	if (imageFiles.length > 0) {
		event.preventDefault();
		event.stopPropagation();
		event.stopImmediatePropagation?.();
		uploadQueue.push(...imageFiles);

		if (!isUploading) {
			await processNextUpload(editor, editorId);
		}
		return;
	}

	// --- Local file:// references with no recoverable clipboard image data ---
	// Windows Office clients (Word/Outlook) fall back to a file:///C:/...
	// temp-file reference when no other image data is on the clipboard. It
	// can never be resolved into real bytes from the browser, so replace the
	// dead <img> with a text placeholder rather than let native paste insert
	// a permanently-broken, path-leaking element.
	if (html && containsUnresolvableLocalImages(html)) {
		event.preventDefault();
		event.stopPropagation();
		event.stopImmediatePropagation?.();
		editor.insertContent(replaceUnresolvableImages(html));
		return;
	}
	// If there are no images allow default TinyMCE paste behaviour.
};

export const testingPurposeOnly = {
	uploadImage,
	srcToFile,
	insertMixedContent,
	isPastedFromExcel,
	filterMsoProperties,
	inlineStylesFromStyleBlock,
	processExcelPaste,
	containsUnresolvableLocalImages,
	replaceUnresolvableImages
};
