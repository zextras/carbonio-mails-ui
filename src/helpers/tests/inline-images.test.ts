/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import {
	dataUriToFile,
	getDataUriFileName,
	isDataImageUri,
	isImageFile,
	readFileAsDataUri
} from '../inline-images';

/** A 1x1 transparent PNG. */
const PNG_BASE64 =
	'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFAAH/q842iQAAAABJRU5ErkJggg==';
const PNG_DATA_URI = `data:image/png;base64,${PNG_BASE64}`;

describe('inline-images', () => {
	describe('isImageFile', () => {
		it('should accept every image mime type', () => {
			expect(isImageFile(new File([''], 'a.png', { type: 'image/png' }))).toBe(true);
			expect(isImageFile(new File([''], 'a.svg', { type: 'image/svg+xml' }))).toBe(true);
		});

		it('should reject a non image file', () => {
			expect(isImageFile(new File([''], 'a.pdf', { type: 'application/pdf' }))).toBe(false);
			expect(isImageFile(new File([''], 'a.bin', { type: '' }))).toBe(false);
		});
	});

	describe('isDataImageUri', () => {
		it('should recognize a base64 image data URI', () => {
			expect(isDataImageUri(PNG_DATA_URI)).toBe(true);
			expect(isDataImageUri('data:image/svg+xml;base64,PHN2Zy8+')).toBe(true);
		});

		it('should reject a data URI which is not a base64 image', () => {
			expect(isDataImageUri('data:text/plain;base64,aGVsbG8=')).toBe(false);
			// Not base64: an URL-encoded payload cannot be decoded by `atob`
			expect(isDataImageUri('data:image/svg+xml,%3Csvg%2F%3E')).toBe(false);
		});

		it('should reject a regular URL', () => {
			expect(isDataImageUri('https://example.com/picture.png')).toBe(false);
			expect(isDataImageUri('cid:image@carbonio')).toBe(false);
		});
	});

	describe('dataUriToFile', () => {
		it('should decode the payload into a file carrying the URI mime type', () => {
			const file = dataUriToFile(PNG_DATA_URI, 'logo.png');

			expect(file).toBeInstanceOf(File);
			expect(file?.name).toBe('logo.png');
			expect(file?.type).toBe('image/png');
			expect(file?.size).toBe(atob(PNG_BASE64).length);
		});

		it('should tolerate whitespace inside the payload', () => {
			const chunked = `data:image/png;base64,${PNG_BASE64.slice(0, 20)}\n${PNG_BASE64.slice(20)}`;

			expect(dataUriToFile(chunked, 'logo.png')?.size).toBe(atob(PNG_BASE64).length);
		});

		it('should return undefined for anything which is not a base64 image data URI', () => {
			expect(dataUriToFile('https://example.com/picture.png', 'logo.png')).toBeUndefined();
			expect(dataUriToFile('data:text/plain;base64,aGVsbG8=', 'logo.png')).toBeUndefined();
			expect(dataUriToFile('data:image/png;base64,', 'logo.png')).toBeUndefined();
		});
	});

	describe('getDataUriFileName', () => {
		it('should build a name with the extension matching the URI mime type', () => {
			expect(getDataUriFileName(PNG_DATA_URI, 1)).toBe('inline-image-1.png');
			expect(getDataUriFileName('data:image/svg+xml;base64,PHN2Zy8+', 2)).toBe(
				'inline-image-2.svg'
			);
		});

		it('should fall back to png when the mime type cannot be read', () => {
			expect(getDataUriFileName('not a data uri', 3)).toBe('inline-image-3.png');
		});
	});

	describe('readFileAsDataUri', () => {
		it('should read an image file back as its data URI', async () => {
			const bytes = Uint8Array.from(atob(PNG_BASE64), (char) => char.charCodeAt(0));
			const file = new File([bytes], 'logo.png', { type: 'image/png' });

			await expect(readFileAsDataUri(file)).resolves.toBe(PNG_DATA_URI);
		});

		it('should round trip through dataUriToFile', async () => {
			const file = dataUriToFile(PNG_DATA_URI, 'logo.png');

			await expect(readFileAsDataUri(file as File)).resolves.toBe(PNG_DATA_URI);
		});
	});
});
