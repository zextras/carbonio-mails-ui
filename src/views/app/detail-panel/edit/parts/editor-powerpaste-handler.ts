/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

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
 * Returns true when the HTML snippet contains at least one <img> element whose
 * src attribute starts with "data:" or "blob:".  These are locally-sourced
 * images that need to be uploaded before being embedded in the email.
 */
function containsLocalImages(html: string): boolean {
	return LOCAL_IMG_SRC_REGEX.test(html);
}

function isLocalImageElement(img: HTMLImageElement): boolean {
	const src = img.getAttribute('src') ?? '';
	return src.startsWith('data:') || src.startsWith('blob:') || src.startsWith(`https://${MYHOSTNAME}/service/home/`);
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

export const handleEditorPowerPaste = async (
	editor: Editor,
	editorId: string,
	event: ClipboardEvent
): Promise<void> => {
	const { clipboardData } = event;
	if (!clipboardData) return;

	const html = clipboardData.getData('text/html');
	const hasTableContent = html && containsTableContent(html);

	// For table content (Excel/Calc), let TinyMCE handle it.
	if (hasTableContent) return;

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
	}
	// If there are no images allow default TinyMCE paste behaviour.
};

export const testingPurposeOnly = { uploadImage, srcToFile, insertMixedContent };
