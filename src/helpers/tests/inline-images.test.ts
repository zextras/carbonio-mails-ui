/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import {
	composeMessagePartUrl,
	dataUriToFile,
	getDataUriFileName,
	getOwnMessagePartUrl,
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

	describe('composeMessagePartUrl', () => {
		const parseUrl = (url: string): URL => new URL(url, window.location.origin);

		it('should not add a content id to the url of a part without one', () => {
			expect(composeMessagePartUrl({ messageId: '42', partName: '2' })).toBe(
				'/service/home/~/?auth=co&id=42&part=2'
			);
		});

		it('should add the content id before the part, which stays the last parameter', () => {
			expect(
				composeMessagePartUrl({ messageId: '42', partName: '2.2', contentId: 'upload@carbonio' })
			).toBe('/service/home/~/?auth=co&id=42&ci=upload%40carbonio&part=2.2');
		});

		it('should give a different url to two images saved in turn at the same part of the same draft', () => {
			const first = composeMessagePartUrl({
				messageId: '42',
				partName: '2',
				contentId: 'first@carbonio'
			});
			const second = composeMessagePartUrl({
				messageId: '42',
				partName: '2',
				contentId: 'second@carbonio'
			});

			expect(first).not.toBe(second);
		});

		it('should not let a content id coming from a message add parameters or a fragment', () => {
			const contentId = 'x&part=1.1&view=html&auth=qp#frag';

			const url = parseUrl(composeMessagePartUrl({ messageId: '42', partName: '2', contentId }));

			expect(Array.from(url.searchParams.keys())).toEqual(['auth', 'id', 'ci', 'part']);
			expect(url.searchParams.get('ci')).toBe(contentId);
			expect(url.searchParams.get('part')).toBe('2');
			expect(url.searchParams.get('auth')).toBe('co');
			expect(url.hash).toBe('');
			expect(url.pathname).toBe('/service/home/~/');
		});

		it('should not throw on a malformed content id', () => {
			expect(() =>
				composeMessagePartUrl({ messageId: '42', partName: '2', contentId: '\uD800@carbonio' })
			).not.toThrow();
		});

		it('should still be recognised as a part of the own messages', () => {
			const url = composeMessagePartUrl({
				messageId: '42',
				partName: '2',
				contentId: 'upload@carbonio'
			});

			expect(getOwnMessagePartUrl(url)).toBe('/service/home/~/?auth=co&id=42&part=2');
		});
	});

	describe('getOwnMessagePartUrl', () => {
		const PART_URL = '/service/home/~/?auth=co&id=99&part=2';

		it('should keep nothing but the message id and the part name', () => {
			expect(
				getOwnMessagePartUrl('/service/home/~/?auth=co&id=99&ci=x%40carbonio&part=2&disp=a')
			).toBe(PART_URL);
		});

		it('should accept an absolute url of this origin', () => {
			expect(getOwnMessagePartUrl(`${window.location.origin}/service/home/~/?id=99&part=2`)).toBe(
				PART_URL
			);
		});

		it.each([
			['another host', 'https://attacker.example/service/home/~/?auth=co&id=99&part=2'],
			['another account', '/service/home/someone@example.com/?id=99&part=2&x=/service/home/~/?'],
			['another path', '/service/zimlet/?id=99&part=2'],
			['no message id', '/service/home/~/?auth=co&part=2'],
			['no part name', '/service/home/~/?auth=co&id=99'],
			['a cid url', 'cid:image@carbonio'],
			['a data uri', PNG_DATA_URI]
		])('should reject %s', (_, src) => {
			expect(getOwnMessagePartUrl(src)).toBeUndefined();
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
