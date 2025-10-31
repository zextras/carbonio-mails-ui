/* eslint-disable sonarjs/no-duplicate-string */
// noinspection HtmlRequiredAltAttribute,HtmlUnknownTarget

/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import {
	areContentIdsEqual,
	decodeHtmlEntities,
	extractContentIdsFromHtml,
	removeAngleBrackets
} from '../content-id-utils';
import {
	DISPOSITION_ATTACHMENT,
	DISPOSITION_INLINE,
	isAttachmentDisposition,
	isInlineDisposition
} from 'helpers/attachments';

describe('Content-ID Utilities', () => {
	describe('Disposition Constants', () => {
		it('should have correct disposition values', () => {
			expect(DISPOSITION_INLINE).toBe('inline');
			expect(DISPOSITION_ATTACHMENT).toBe('attachment');
		});
	});

	describe('isInlineDisposition', () => {
		it('should return true for inline disposition', () => {
			expect(isInlineDisposition('inline')).toBe(true);
		});

		it('should return false for attachment disposition', () => {
			expect(isInlineDisposition('attachment')).toBe(false);
		});

		it('should return false for undefined', () => {
			expect(isInlineDisposition(undefined)).toBe(false);
		});

		it('should return false for other values', () => {
			expect(isInlineDisposition('other')).toBe(false);
		});
	});

	describe('isAttachmentDisposition', () => {
		it('should return true for attachment disposition', () => {
			expect(isAttachmentDisposition('attachment')).toBe(true);
		});

		it('should return false for inline disposition', () => {
			expect(isAttachmentDisposition('inline')).toBe(false);
		});

		it('should return false for undefined', () => {
			expect(isAttachmentDisposition(undefined)).toBe(false);
		});

		it('should return false for other values', () => {
			expect(isAttachmentDisposition('other')).toBe(false);
		});
	});

	describe('decodeHtmlEntities', () => {
		it('should decode &#64; to @', () => {
			expect(decodeHtmlEntities('image&#64;domain.com')).toBe('image@domain.com');
		});

		it('should decode &#39; to single quote', () => {
			expect(decodeHtmlEntities('test&#39;s')).toBe("test's");
		});

		it('should decode &amp; to &', () => {
			expect(decodeHtmlEntities('test&amp;data')).toBe('test&data');
		});

		it('should decode multiple entities', () => {
			expect(decodeHtmlEntities('test&#34;quote&#34;&amp;data&#64;domain.com')).toBe(
				'test"quote"&data@domain.com'
			);
		});

		it('should return original string if no entities present', () => {
			expect(decodeHtmlEntities('normal-string@domain.com')).toBe('normal-string@domain.com');
		});
	});

	describe('removeAngleBrackets', () => {
		it('should remove angle brackets from both sides', () => {
			expect(removeAngleBrackets('<image@domain.com>')).toBe('image@domain.com');
		});

		it('should remove only opening bracket', () => {
			expect(removeAngleBrackets('<image@domain.com')).toBe('image@domain.com');
		});

		it('should remove only closing bracket', () => {
			expect(removeAngleBrackets('image@domain.com>')).toBe('image@domain.com');
		});

		it('should return string unchanged if no brackets', () => {
			expect(removeAngleBrackets('image@domain.com')).toBe('image@domain.com');
		});

		it('should handle empty string', () => {
			expect(removeAngleBrackets('')).toBe('');
		});
	});

	describe('extractContentIdsFromHtml', () => {
		it('should extract single CID from img src attribute', () => {
			const html = '<img src="cid:logo@company.com" alt="logo">';
			expect(extractContentIdsFromHtml(html)).toEqual(['logo@company.com']);
		});

		it('should extract multiple CIDs from HTML', () => {
			const html =
				'<img src="cid:img1@test.com"> <img src="cid:img2@test.com"> <img src="cid:img3@test.com">';
			expect(extractContentIdsFromHtml(html)).toEqual([
				'img1@test.com',
				'img2@test.com',
				'img3@test.com'
			]);
		});

		it('should decode HTML entities in CIDs', () => {
			const html = '<img src="cid:image&#64;carbonio.com">';
			expect(extractContentIdsFromHtml(html)).toEqual(['image@carbonio.com']);
		});

		it('should handle CIDs with special characters', () => {
			const html = '<img src="cid:f47ac10b-58cc-4372-a567-0e02b2c3d479:attachment@example.com">';
			expect(extractContentIdsFromHtml(html)).toEqual([
				'f47ac10b-58cc-4372-a567-0e02b2c3d479:attachment@example.com'
			]);
		});

		it('should extract CIDs from anchor href attributes', () => {
			const html = '<a href="cid:document@example.com">View</a>';
			expect(extractContentIdsFromHtml(html)).toEqual(['document@example.com']);
		});

		it('should extract CIDs that end with whitespace', () => {
			const html = '<img src="cid:logo@test.com" />';
			expect(extractContentIdsFromHtml(html)).toEqual(['logo@test.com']);
		});

		it('should extract CIDs that end with tag closure', () => {
			const html = '<img src="cid:logo@test.com">';
			expect(extractContentIdsFromHtml(html)).toEqual(['logo@test.com']);
		});

		it('should handle complex HTML with multiple entity-encoded CIDs', () => {
			const html = `
				<div>
					<img src="cid:2dbe26b8-2c96-40a0-94c5-ad891bac1f9a&#64;carbonio" />
					<img src="cid:b8c321cd-0b7b-4a18-8b86-da38b937b6eb&#64;carbonio" alt="pic1" />
					<img src="cid:65766eee-4439-438c-a375-1ac111ed1a07&#64;carbonio" />
				</div>
			`;
			expect(extractContentIdsFromHtml(html)).toEqual([
				'2dbe26b8-2c96-40a0-94c5-ad891bac1f9a@carbonio',
				'b8c321cd-0b7b-4a18-8b86-da38b937b6eb@carbonio',
				'65766eee-4439-438c-a375-1ac111ed1a07@carbonio'
			]);
		});

		it('should return empty array if no CIDs found', () => {
			const html = '<p>This is plain text with no images</p>';
			expect(extractContentIdsFromHtml(html)).toEqual([]);
		});

		it('should handle CIDs without quotes (plain text)', () => {
			const html = 'This is plain text body with a link: cid:123:456';
			expect(extractContentIdsFromHtml(html)).toEqual(['123:456']);
		});

		it('should handle malformed HTML', () => {
			const html = '<a href="cid:123:456 >';
			expect(extractContentIdsFromHtml(html)).toEqual(['123:456']);
		});
	});

	describe('areContentIdsEqual', () => {
		it('should return true for identical strings', () => {
			expect(areContentIdsEqual('image@test.com', 'image@test.com')).toBe(true);
		});

		it('should return true when first has angle brackets', () => {
			expect(areContentIdsEqual('<image@test.com>', 'image@test.com')).toBe(true);
		});

		it('should return true when second has angle brackets', () => {
			expect(areContentIdsEqual('image@test.com', '<image@test.com>')).toBe(true);
		});

		it('should return true when both have angle brackets', () => {
			expect(areContentIdsEqual('<image@test.com>', '<image@test.com>')).toBe(true);
		});

		it('should return false for different content IDs', () => {
			expect(areContentIdsEqual('image1@test.com', 'image2@test.com')).toBe(false);
		});

		it('should handle complex UUIDs correctly', () => {
			const cid1 = '<f47ac10b-58cc-4372-a567-0e02b2c3d479@example.com>';
			const cid2 = 'f47ac10b-58cc-4372-a567-0e02b2c3d479@example.com';
			expect(areContentIdsEqual(cid1, cid2)).toBe(true);
		});
	});
});
