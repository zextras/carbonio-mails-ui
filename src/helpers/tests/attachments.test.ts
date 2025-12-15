/* eslint-disable sonarjs/no-duplicate-string */
// noinspection CssInvalidHtmlTagReference,HtmlRequiredLangAttribute,HtmlRequiredAltAttribute,HtmlUnknownTarget

/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { generateMessage } from '__test__/generators/generateMessage';
import { areContentIdsEqual } from 'commons/content-id-utils';
import {
	buildSavedAttachments,
	getAttachmentExtension,
	getReferredContentIds
} from 'helpers/attachments';

describe('attachments', () => {
	describe('isContentEqual', () => {
		test('return true if the strings are exactly the same', () => {
			const contentId = 'cid:cd2cf820-9642-433c-a2f1-23b0175254cd@carbonio';
			const otherContentID = 'cid:cd2cf820-9642-433c-a2f1-23b0175254cd@carbonio';
			expect(areContentIdsEqual(contentId, otherContentID)).toBe(true);
		});

		test('return true if the content inside the angle brackets of the first param is the same as the other', () => {
			const contentId = '<cid:cd2cf820-9642-433c-a2f1-23b0175254cd@carbonio>';
			const otherContentID = 'cid:cd2cf820-9642-433c-a2f1-23b0175254cd@carbonio';
			expect(areContentIdsEqual(contentId, otherContentID)).toBe(true);
		});

		test('return true if the content inside the angle brackets of the second param is the same as the other', () => {
			const contentId = 'cid:cd2cf820-9642-433c-a2f1-23b0175254cd@carbonio';
			const otherContentID = '<cid:cd2cf820-9642-433c-a2f1-23b0175254cd@carbonio>';
			expect(areContentIdsEqual(contentId, otherContentID)).toBe(true);
		});

		test('return false if the content is not the same', () => {
			const contentId = 'cid:fffffff-ffff-ffff-ffff-23b0175254cd@carbonio';
			const otherContentID = '<cid:cd2cf820-9642-433c-a2f1-23b0175254cd@carbonio>';
			expect(areContentIdsEqual(contentId, otherContentID)).toBe(false);
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
					cd: 'attachment',
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
					cd: undefined,
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
					content: 'This is my inline image: <a href="cid:abc123@zimbra"/>',
					body: true
				},
				{
					contentType: 'image/png',
					filename: 'img.png',
					name: '2.2',
					size: 1234,
					cd: undefined,
					ci: '<abc123@zimbra>'
				}
			];

			const result = buildSavedAttachments(message);

			expect(result[0]).toMatchObject({
				isInline: true,
				contentId: '<abc123@zimbra>',
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
					cd: 'inline',
					ci: '<123>',
					filename: 'doc.pdf',
					name: '2.3',
					size: 2048
				},
				{
					contentType: 'text/html',
					content: 'Hello <a href="cid:123"/>',
					name: '2.4',
					size: 2048,
					body: true
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

		it('should NOT extract inner contentId from brackets', () => {
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
			expect(result[0].contentId).toBe('<image123@crb>');
		});

		it('should leave contentId undefined if ci is not present', () => {
			const message = generateMessage({ folderId: '2' });
			message.parts = [
				{
					contentType: 'image/jpeg',
					cd: 'attachment',
					filename: 'test.jpeg',
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
					contentId: '<65766eee-4439-438c-a375-1ac111ed1a07@zimbra>',
					filename: '', // no filename provided
					partName: '2.2',
					contentType: 'text/html',
					size: 999
				}
			]);
		});
	});

	describe('getAttachmentExtension', () => {
		describe('MIME type mapping', () => {
			describe('Text types', () => {
				test.each([
					['text/html', { value: 'html' }],
					['text/plain', { value: 'txt' }],
					['text/css', { value: 'css' }],
					['text/xml', { value: 'xml' }]
				])('should return correct extension for %s', (mimeType, expected) => {
					expect(getAttachmentExtension(mimeType)).toEqual(expected);
				});
			});

			describe('Image types', () => {
				test.each([
					['image/jpeg', { value: 'jpg' }],
					['image/png', { value: 'png' }],
					['image/gif', { value: 'gif' }],
					['image/svg+xml', { value: 'svg' }],
					['image/webp', { value: 'webp' }],
					['image/x-ms-bmp', { value: 'bmp' }],
					['image/x-icon', { value: 'ico' }],
					['image/tiff', { value: 'tif,tiff', displayName: 'tif' }]
				])('should return correct extension for %s', (mimeType, expected) => {
					expect(getAttachmentExtension(mimeType)).toEqual(expected);
				});
			});

			describe('Application types', () => {
				test.each([
					['application/pdf', { value: 'pdf' }],
					['application/zip', { value: 'zip' }],
					['application/msword', { value: 'doc' }],
					['application/vnd.ms-excel', { value: 'xls' }],
					['application/vnd.ms-powerpoint', { value: 'ppt' }],
					['application/rtf', { value: 'rtf' }],
					['application/x-rar-compressed', { value: 'rar' }],
					['application/x-javascript', { value: 'js' }]
				])('should return correct extension for %s', (mimeType, expected) => {
					expect(getAttachmentExtension(mimeType)).toEqual(expected);
				});
			});

			describe('Audio types', () => {
				test.each([
					['audio/mpeg', { value: 'mp' }],
					['audio/ogg', { value: 'ogg' }],
					['audio/midi', { value: 'midi' }]
				])('should return correct extension for %s', (mimeType, expected) => {
					expect(getAttachmentExtension(mimeType)).toEqual(expected);
				});
			});

			describe('Video types', () => {
				test.each([
					['video/mpeg', { value: 'mpeg' }],
					['video/x-msvideo', { value: 'avi' }],
					['video/quicktime', { value: 'mov' }],
					['video/mp', { value: 'mp' }]
				])('should return correct extension for %s', (mimeType, expected) => {
					expect(getAttachmentExtension(mimeType)).toEqual(expected);
				});
			});

			describe('Message types', () => {
				test.each([['message/rfc822', { value: 'EML' }]])(
					'should return correct extension for %s',
					(mimeType, expected) => {
						expect(getAttachmentExtension(mimeType)).toEqual(expected);
					}
				);
			});
		});

		describe('Filename fallback', () => {
			test.each([
				['unknown content type', 'application/unknown', 'document.docx', { value: 'docx' }],
				['multiple dots', 'application/unknown', 'archive.tar.gz', { value: 'gz' }],
				['uppercase extension', 'application/unknown', 'REPORT.XLSX', { value: 'XLSX' }],
				['path-like structure', 'application/unknown', 'path/to/file.mp4', { value: 'mp4' }],
				['undefined content type', undefined, 'image.jpeg', { value: 'jpeg' }],
				['empty content type', '', 'video.mkv', { value: 'mkv' }]
			])(
				'should extract extension from filename when %s',
				(_desc, contentType, filename, expected) => {
					expect(getAttachmentExtension(contentType, filename)).toEqual(expected);
				}
			);

			it('should prefer MIME type over filename extension', () => {
				expect(getAttachmentExtension('application/pdf', 'file.txt')).toEqual({ value: 'pdf' });
			});
		});

		describe('Edge cases', () => {
			test.each([
				['both parameters undefined', undefined, undefined],
				['unknown content type and no filename', 'application/x-custom-unknown', undefined],
				['filename without extension', 'application/unknown', 'README'],
				['empty filename', 'application/unknown', ''],
				['filename is just a dot', 'application/unknown', '.'],
				['hidden files', 'application/unknown', '.gitignore'],
				['filename with trailing dot', 'application/unknown', 'file.']
			])('should return "?" when %s', (_desc, contentType, filename) => {
				expect(getAttachmentExtension(contentType, filename)).toEqual({ value: '?' });
			});

			test.each([
				['single character', 'application/unknown', 'file.c', { value: 'c' }],
				[
					'very long extension',
					'application/unknown',
					'file.verylongextension123',
					{ value: 'verylongextension123' }
				]
			])('should handle %s extensions', (_desc, contentType, filename, expected) => {
				expect(getAttachmentExtension(contentType, filename)).toEqual(expected);
			});
		});

		describe('Real-world scenarios', () => {
			test.each([
				['Office DOC', 'application/msword', 'report.doc', { value: 'doc' }],
				[
					'Office DOCX',
					'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
					'report.docx',
					{ value: 'docx' }
				],
				['calendar file', 'text/calendar', 'meeting.ics', { value: 'ics' }],
				['vCard file', 'text/vcard', 'contact.vcf', { value: 'vcf' }],
				['7z archive', 'application/x-7z-compressed', 'archive.7z', { value: '7z' }],
				['email without filename', 'message/rfc822', undefined, { value: 'EML' }],
				['generic image type', 'image/*', 'photo.heic', { value: 'heic' }]
			])('should handle %s', (_desc, contentType, filename, expected) => {
				expect(getAttachmentExtension(contentType, filename)).toEqual(expected);
			});
		});

		describe('Integration with actual usage', () => {
			test.each([
				['both contentType and filename', 'image/jpeg', 'photo.jpg', { value: 'jpg' }],
				['only contentType', 'application/pdf', undefined, { value: 'pdf' }],
				['only filename', undefined, 'spreadsheet.xlsx', { value: 'xlsx' }]
			])('should work with %s from AttachmentPart', (_desc, contentType, filename, expected) => {
				expect(getAttachmentExtension(contentType, filename)).toEqual(expected);
			});
		});
	});
});
