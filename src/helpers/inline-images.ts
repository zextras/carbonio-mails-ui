/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/**
 * Helpers shared by the two places where an inline image can enter an editor
 * without going through an upload: the signature editor (which embeds the
 * picked file as a `data:` URI, since a signature has no draft to attach to)
 * and the mail composer (which turns those `data:` URIs back into real files to
 * upload as inline attachments).
 */

/** Matches `data:<mime>;base64,<payload>` restricted to image mime types. */
const DATA_IMAGE_URI_REGEXP = /^data:(image\/[a-z0-9.+-]+);base64,([a-z0-9+/=\s]+)$/i;

export const isImageFile = (file: File): boolean => file.type.startsWith('image/');

export const isDataImageUri = (src: string): boolean => DATA_IMAGE_URI_REGEXP.test(src);

/**
 * Reads the given file and resolves with its content as a `data:` URI.
 */
export const readFileAsDataUri = (file: File): Promise<string> =>
	new Promise((resolve, reject) => {
		const fileReader = new FileReader();
		fileReader.addEventListener('load', () => {
			if (typeof fileReader.result === 'string') {
				resolve(fileReader.result);
				return;
			}
			reject(new Error(`Cannot read the file ${file.name} as a data URI`));
		});
		fileReader.addEventListener('error', () => {
			reject(fileReader.error ?? new Error(`Cannot read the file ${file.name}`));
		});
		fileReader.readAsDataURL(file);
	});

/**
 * Converts a base64 `data:` image URI back into a {@link File}, so it can be
 * uploaded as a regular inline attachment.
 *
 * The payload is decoded through `atob` rather than by fetching the data URI:
 * `fetch` on a `data:` URI is not implemented by jsdom, and this path has to
 * work in the unit tests as well as in the browser.
 *
 * @returns the decoded file, or `undefined` if the URI is not a valid base64
 * image data URI.
 */
export const dataUriToFile = (dataUri: string, fileName: string): File | undefined => {
	const match = DATA_IMAGE_URI_REGEXP.exec(dataUri);
	if (!match) {
		return undefined;
	}

	const [, mimeType, payload] = match;
	try {
		const binary = atob(payload.replace(/\s/g, ''));
		const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
		return new File([bytes], fileName, { type: mimeType });
	} catch {
		return undefined;
	}
};

/**
 * Returns a plausible file name for an image extracted from a `data:` URI,
 * which carries no name of its own.
 */
export const getDataUriFileName = (dataUri: string, index: number): string => {
	const mimeType = DATA_IMAGE_URI_REGEXP.exec(dataUri)?.[1] ?? 'image/png';
	const extension = mimeType.replace('image/', '').replace('+xml', '');
	return `inline-image-${index}.${extension}`;
};
