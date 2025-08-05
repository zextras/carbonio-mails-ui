/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
// noinspection HtmlRequiredLangAttribute

import { filterAttachmentsParts, getReferredContentIds } from 'helpers/attachments';
import type { MailMessagePart } from 'types/index.d';

describe('attachments', () => {
	describe('getReferredContentIds', () => {
		it('should return an array of strings if content is declared and contentType is text/html ', () => {
			const parts = [
				{
					contentType: 'text/html',
					content: `<html><body><div style="font-family:&#39;arial&#39; , &#39;helvetica&#39; , sans-serif;font-size:12pt;color:#000000"><div style="font-family:&#39;arial&#39; , &#39;helvetica&#39; , sans-serif;font-size:12pt;color:#000000">\r\n<div style="font-family:&#39;arial&#39; , &#39;helvetica&#39; , sans-serif;font-size:12pt;color:#000000">\r\n<div style="font-family:&#39;arial&#39; , &#39;helvetica&#39; , sans-serif;font-size:12pt;color:#000000"> <img src="cid:2dbe26b8-2c96-40a0-94c5-ad891bac1f9a&#64;carbonio" /> <img src="cid:b8c321cd-0b7b-4a18-8b86-da38b937b6eb&#64;carbonio" alt="pic1" data-testId="picture1"/> <img src="cid:65766eee-4439-438c-a375-1ac111ed1a07&#64;carbonio" /><br /><br />\r\n<div><br />Kind Regards <br /><br />something</div>\r\n</div>\r\n</div>\r\n</div></div></body></html>`,
					size: 999,
					name: 'filename.jpg'
				}
			];
			expect(getReferredContentIds(parts)).toStrictEqual([
				'2dbe26b8-2c96-40a0-94c5-ad891bac1f9a@carbonio',
				'b8c321cd-0b7b-4a18-8b86-da38b937b6eb@carbonio',
				'65766eee-4439-438c-a375-1ac111ed1a07@carbonio'
			]);
		});

		it('should return an empty array if content is declared and contentType is not text/html ', () => {
			const parts = [
				{
					contentType: 'wrong/content/type',
					content: `<html><body><div style="font-family:&#39;arial&#39; , &#39;helvetica&#39; , sans-serif;font-size:12pt;color:#000000"><div style="font-family:&#39;arial&#39; , &#39;helvetica&#39; , sans-serif;font-size:12pt;color:#000000">\r\n<div style="font-family:&#39;arial&#39; , &#39;helvetica&#39; , sans-serif;font-size:12pt;color:#000000">\r\n<div style="font-family:&#39;arial&#39; , &#39;helvetica&#39; , sans-serif;font-size:12pt;color:#000000"> <img src="cid:2dbe26b8-2c96-40a0-94c5-ad891bac1f9a&#64;carbonio" /> <img src="cid:b8c321cd-0b7b-4a18-8b86-da38b937b6eb&#64;carbonio" alt="pic1" data-testId="picture1"/> <img src="cid:65766eee-4439-438c-a375-1ac111ed1a07&#64;carbonio" /><br /><br />\r\n<div><br />Kind Regards <br /><br />something</div>\r\n</div>\r\n</div>\r\n</div></div></body></html>`,
					size: 999,
					name: 'filename.jpg'
				}
			];
			expect(getReferredContentIds(parts).length).toBe(0);
		});
	});

	describe('filterAttachmentsParts', () => {
		it('should include inline images that are referenced by cid even if they lack a filename', () => {
			const parts: Array<MailMessagePart> = [
				{
					// filename intentionally missing
					name: '2',
					ci: 'img123',
					disposition: 'inline',
					contentType: 'image/png',
					size: 200
				}
			];

			const referredCids = ['img123'];
			const result = filterAttachmentsParts(parts, [], referredCids);

			expect(result).toHaveLength(1);
			expect(result[0].ci).toBe('img123');
		});

		it('should exclude inline images without filename or CID reference', () => {
			const parts: Array<MailMessagePart> = [
				{
					ci: 'img456',
					disposition: 'inline',
					contentType: 'image/png',
					size: 200,
					name: '3'
				}
			];

			const referredCids: Array<string> = []; // no reference
			const result = filterAttachmentsParts(parts, [], referredCids);

			expect(result).toHaveLength(1);
		});

		it('should include inline images with filename regardless of CID', () => {
			const parts: Array<MailMessagePart> = [
				{
					name: '4',
					ci: 'img789',
					disposition: 'inline',
					contentType: 'image/jpeg',
					filename: 'logo.jpg',
					size: 200
				}
			];

			const referredCids: Array<string> = [];
			const result = filterAttachmentsParts(parts, [], referredCids);

			expect(result).toHaveLength(1);
			expect(result[0].filename).toBe('logo.jpg');
		});
	});
});
