/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'] as const;
const IMAGE_URL_REGEX = new RegExp(
	`^https?:\\/\\/.+\\.(${IMAGE_EXTENSIONS.join('|')})(\\?.+)?$`,
	'i'
);

const IMG_TAG_REGEX = /<img[^>]+src=["'](http[^"']+)["']/i;
const TABLE_TAG_REGEX = /<table/i;

function isImageUrl(text: string): boolean {
	return IMAGE_URL_REGEX.test(text.trim());
}

function containsExternalImages(html: string): boolean {
	return IMG_TAG_REGEX.test(html);
}

function containsTableContent(html: string): boolean {
	return TABLE_TAG_REGEX.test(html);
}

function getImageFilesFromClipboard(clipboardData: DataTransfer): Array<File> {
	return Array.from(clipboardData.items)
		.filter((item) => item.type.includes('image'))
		.map((item) => item.getAsFile())
		.filter((file): file is File => file !== null);
}

/**
 * Extracts the local image files that should be uploaded inline from a paste
 * event, mirroring the previous TinyMCE behaviour:
 *  - skips when the clipboard carries table content (Excel/Calc paste);
 *  - skips when the clipboard contains an external image URL (plain text);
 *  - skips when the HTML payload references an external `<img>`.
 *
 * Returns an empty array when the default paste behaviour should be kept.
 */
export const getPastedInlineImageFiles = (event: ClipboardEvent): Array<File> => {
	const { clipboardData } = event;
	if (!clipboardData) {
		return [];
	}

	const html = clipboardData.getData('text/html');
	const hasTableContent = html && containsTableContent(html);

	const imageFiles = getImageFilesFromClipboard(clipboardData);
	if (imageFiles.length === 0 || hasTableContent) {
		return [];
	}

	const pastedText = clipboardData.getData('text/plain');
	if (pastedText && isImageUrl(pastedText)) {
		return [];
	}

	if (html && containsExternalImages(html)) {
		return [];
	}

	return imageFiles;
};

/**
 * Builds a paste handler compatible with TipTap's `editorProps.handlePaste`.
 *
 * When the clipboard carries local image files, the default paste is prevented
 * and the files are forwarded to `onImageFiles` (which uploads them as inline
 * attachments and inserts the resulting `<img>`). Returning `true` tells
 * ProseMirror the event has been handled; returning `false` keeps the default
 * paste behaviour (text, tables, external images, ...).
 */
export const createTipTapPasteHandler =
	({ onImageFiles }: { onImageFiles: (files: Array<File>) => void }) =>
	(event: ClipboardEvent): boolean => {
		const imageFiles = getPastedInlineImageFiles(event);
		if (imageFiles.length === 0) {
			return false;
		}

		event.preventDefault();
		onImageFiles(imageFiles);
		return true;
	};
