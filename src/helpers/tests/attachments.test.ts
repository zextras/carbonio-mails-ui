/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { generateMessage } from '../../tests/generators/generateMessage';
import type { MailMessagePart } from '../../types';
import { getMsgSoapApi } from 'api/get-msg-soap-api';
import {
	buildSavedAttachments,
	getAttachmentParts,
	getReferredContentIds,
	isContentIdEqual
} from 'helpers/attachments';
import { normalizeMailMessageFromSoap } from 'normalizations/normalize-message';

describe('attachments', () => {
	describe('getAttachmentParts', () => {
		describe('should return part with disposition inline', () => {
			test('if has disposition inline', () => {
				const parts: Array<MailMessagePart> = [
					{
						name: '2',
						disposition: 'inline',
						contentType: 'image/png',
						size: 200
					}
				];

				const result = getAttachmentParts(parts);

				expect(result).toHaveLength(1);
				expect(result[0].disposition).toBe('inline');
			});
			test('if has no disposition and referenced by another part', () => {
				const ci = '123:456';
				const parts: Array<MailMessagePart> = [
					{
						name: 'body',
						contentType: 'text/html',
						content: `<a href="cid:${ci}"/>`,
						size: 200
					},
					{
						ci,
						name: '2',
						contentType: 'image/png',
						size: 200
					}
				];

				const result = getAttachmentParts(parts);

				expect(result).toHaveLength(1);
				expect(result[0].disposition).toBe('inline');
			});
		});
		describe('should return part with disposition attachment', () => {
			test('if has disposition attachment', () => {
				const parts: Array<MailMessagePart> = [
					{
						name: '2',
						disposition: 'attachment',
						contentType: 'image/png',
						size: 200
					}
				];

				const result = getAttachmentParts(parts);

				expect(result).toHaveLength(1);
				expect(result[0].disposition).toBe('attachment');
			});
			test('if has no disposition and not referenced by any another part', () => {
				const ci = '123:456';
				const parts: Array<MailMessagePart> = [
					{
						name: 'body',
						contentType: 'text/html',
						content: `<a href="no-reference-buddy"/>`,
						size: 200
					},
					{
						ci,
						name: '2',
						contentType: 'image/png',
						size: 200
					}
				];

				const result = getAttachmentParts(parts);

				expect(result).toHaveLength(1);
				expect(result[0].disposition).toBe('attachment');
			});
		});
		test('Inline attachment without content disposition are recognized anyway', async () => {
			const getMsgResponse = await getMsgSoapApi({ msgId: '13' });
			const msg = normalizeMailMessageFromSoap(getMsgResponse.m[0], true);
			const attachmentParts = getAttachmentParts(msg.parts);
			expect(attachmentParts).toHaveLength(1);
			expect(attachmentParts[0].name).toBe('2');
			expect(attachmentParts[0].disposition).toBe('inline');
			expect(attachmentParts[0].filename).toBe('image001.jpg');
			expect(attachmentParts[0].ci).toBe('<image001.jpg@01D9CB62.1AADEDA0>');
		});

		// TODO: these tests are weak (they pass after changing tested function), \
		//  some titles don't represent the actual test
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

			const result = getAttachmentParts(parts);

			expect(result).toHaveLength(1);
			expect(result[0].ci).toBe('img123');
		});

		it('should include inline images without filename or CID reference', () => {
			const parts: Array<MailMessagePart> = [
				{
					ci: 'img456',
					disposition: 'inline',
					contentType: 'image/png',
					size: 200,
					name: '3'
				}
			];
			const result = getAttachmentParts(parts);

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

			const result = getAttachmentParts(parts);

			expect(result).toHaveLength(1);
			expect(result[0].filename).toBe('logo.jpg');
		});
	});

	describe('isContentEqual', () => {
		test('return true if the strings are exactly the same', () => {
			const contentId = 'cid:cd2cf820-9642-433c-a2f1-23b0175254cd@carbonio';
			const otherContentID = 'cid:cd2cf820-9642-433c-a2f1-23b0175254cd@carbonio';
			expect(isContentIdEqual(contentId, otherContentID)).toBe(true);
		});

		test('return true if the content inside the angle brackets of the first param is the same as the other', () => {
			const contentId = '<cid:cd2cf820-9642-433c-a2f1-23b0175254cd@carbonio>';
			const otherContentID = 'cid:cd2cf820-9642-433c-a2f1-23b0175254cd@carbonio';
			expect(isContentIdEqual(contentId, otherContentID)).toBe(true);
		});

		test('return true if the content inside the angle brackets of the second param is the same as the other', () => {
			const contentId = 'cid:cd2cf820-9642-433c-a2f1-23b0175254cd@carbonio';
			const otherContentID = '<cid:cd2cf820-9642-433c-a2f1-23b0175254cd@carbonio>';
			expect(isContentIdEqual(contentId, otherContentID)).toBe(true);
		});

		test('return false if the content is not the same', () => {
			const contentId = 'cid:fffffff-ffff-ffff-ffff-23b0175254cd@carbonio';
			const otherContentID = '<cid:cd2cf820-9642-433c-a2f1-23b0175254cd@carbonio>';
			expect(isContentIdEqual(contentId, otherContentID)).toBe(false);
		});
	});

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

	describe('buildSavedAttachments', () => {
		it('should return an empty array when there are no parts', () => {
			const message = generateMessage({ folderId: '2' });
			message.parts = [];
			const result = buildSavedAttachments(message);
			expect(result).toEqual([]);
		});
		it('should set attachment as not inline if disposition is not inline', () => {
			const message = generateMessage({ folderId: '2' });
			message.parts = [
				{
					contentType: 'image/png',
					filename: 'img.png',
					disposition: 'attachment',
					name: '2.2',
					size: 1234,
					ci: '<abc123@zimbra>'
				}
			];
			const result = buildSavedAttachments(message);

			expect(result[0].isInline).toBeFalsy();
		});
		it('should mark attachment with contentId and type image/* as NOT inline if NOT referenced in the body ', () => {
			const message = generateMessage({ folderId: '2' });
			message.parts = [
				{
					contentType: 'text/html',
					size: 0,
					name: 'HTML body',
					content: 'This is my inline image: <a href="wrongCIDReference:<abc123@zimbra>"/>'
				},
				{
					contentType: 'image/png',
					filename: 'img.png',
					name: '2.2',
					size: 1234,
					disposition: undefined,
					ci: '<abc123@zimbra>'
				}
			];

			const result = buildSavedAttachments(message);

			expect(result[0].isInline).toBeFalsy();
		});
		it('should mark attachment with contentId and type image/* as inline if referenced in the body ', () => {
			const message = generateMessage({ folderId: '2' });
			message.parts = [
				{
					contentType: 'text/html',
					size: 0,
					name: 'HTML body',
					content: 'This is my inline image: <a href="cid:<abc123@zimbra>"/>'
				},
				{
					contentType: 'image/png',
					filename: 'img.png',
					name: '2.2',
					size: 1234,
					disposition: undefined,
					ci: '<abc123@zimbra>'
				}
			];

			const result = buildSavedAttachments(message);

			expect(result[0]).toMatchObject({
				isInline: true,
				contentId: 'abc123@zimbra',
				partName: '2.2',
				contentType: 'image/png',
				filename: 'img.png',
				messageId: message.id
			});
		});

		it('should mark part with disposition "inline" as inline even if not an image', () => {
			const message = generateMessage({ folderId: '2' });

			message.parts = [
				{
					contentType: 'application/pdf',
					disposition: 'inline',
					filename: 'doc.pdf',
					name: '2.3',
					size: 2048
				}
			];

			const result = buildSavedAttachments(message);
			expect(result[0].isInline).toBe(true);
		});

		it('should not mark as inline when contentId is missing and disposition is not "inline"', () => {
			const message = generateMessage({ folderId: '2' });
			message.parts = [
				{
					contentType: 'application/pdf',
					filename: 'doc.pdf',
					name: '2.4',
					size: 512
				}
			];

			const result = buildSavedAttachments(message);
			expect(result[0].isInline).toBe(false);
		});

		it('should extract inner contentId from brackets', () => {
			const message = generateMessage({ folderId: '2' });
			message.parts = [
				{
					contentType: 'image/jpeg',
					ci: '<image123@crb>',
					name: '2.5',
					size: 200
				}
			];

			const result = buildSavedAttachments(message);
			expect(result[0].contentId).toBe('image123@crb');
		});

		it('should leave contentId undefined if ci is not present', () => {
			const message = generateMessage({ folderId: '2' });
			message.parts = [
				{
					contentType: 'image/jpeg',
					name: '2.6',
					size: 300
				}
			];

			const result = buildSavedAttachments(message);
			expect(result[0].contentId).toBeUndefined();
		});

		it('should correctly build a SavedAttachment for a part with inline CID and text/html content', () => {
			const message = generateMessage({ folderId: '2' });

			message.parts = [
				{
					contentType: 'text/html',
					content: `<html><body>
				<img src="cid:65766eee-4439-438c-a375-1ac111ed1a07@zimbra" />
				<p>Hello, this is a test email with inline image.</p>
			</body></html>`,
					size: 999,
					name: '2.2',
					ci: '<65766eee-4439-438c-a375-1ac111ed1a07@zimbra>'
				}
			];

			const result = buildSavedAttachments(message);

			expect(result).toEqual([
				{
					messageId: message.id,
					isInline: true, // because ci is present and contentType is text/html
					contentId: '65766eee-4439-438c-a375-1ac111ed1a07@zimbra',
					filename: '', // no filename provided
					partName: '2.2',
					contentType: 'text/html',
					size: 999
				}
			]);
		});
	});
});
