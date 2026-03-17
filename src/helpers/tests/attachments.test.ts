/* eslint-disable sonarjs/no-duplicate-string */
// noinspection CssInvalidHtmlTagReference,HtmlRequiredLangAttribute,HtmlRequiredAltAttribute,HtmlUnknownTarget

/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { generateMessage } from '__test__/generators/generateMessage';
import { getMsgSoapApi } from 'api/get-msg-soap-api';
import { areContentIdsEqual } from 'commons/content-id-utils';
import {
	buildSavedAttachments,
	getAttachmentExtension,
	getFlattenedAttachmentParts,
	getReferredContentIds
} from 'helpers/attachments';
import { normalizeMailMessageFromSoap } from 'normalizations/normalize-message';
import { MailMessagePart } from 'types/messages';

describe('attachments', () => {
	describe('getFlattenedAttachmentParts', () => {
		const attachmentPart = {
			name: 'attachmentPart',
			disposition: 'attachment' as const,
			contentType: 'image/png',
			size: 200
		};
		const inlinePart = {
			name: 'inlinePart',
			disposition: 'inline' as const,
			contentType: 'image/png',
			size: 200
		};
		const noDispositionPart = {
			name: 'noDispositionPart',
			contentType: 'image/png',
			size: 200
		};
		describe('should return part with disposition inline', () => {
			test('if has disposition inline', () => {
				const parts: Array<MailMessagePart> = [inlinePart];
				const message = generateMessage({ parts });

				const result = getFlattenedAttachmentParts(message);

				expect(result).toHaveLength(1);
				expect(result[0].disposition).toBe('inline');
			});

			test('if has disposition attachment but referenced by Text/Html part', () => {
				const ci = '123:456';
				const parts: Array<MailMessagePart> = [
					{
						...attachmentPart,
						ci
					},
					{
						name: 'body',
						contentType: 'text/html',
						content: `<a href="cid:${ci}"/>`,
						size: 200
					}
				];
				const message = generateMessage({ parts });

				const result = getFlattenedAttachmentParts(message);

				expect(result).toHaveLength(1);
				expect(result[0].disposition).toBe('inline');
			});

			// TODO: This test is exposing the fact that the function is not checking if the cid is referenced in an anchor href or src of img/object/embed
			//  this may lead to false positives, when the cid is referenced in a Text/Html part without an anchor href or img/object/embed
			test('if has disposition attachment, has ci and referenced in a Text/Html part with double quotes', () => {
				const ci = '123:456';
				const parts: Array<MailMessagePart> = [
					{
						name: 'body',
						contentType: 'text/html',
						content: `This is plain text body with a link: "cid:${ci}"`,
						size: 200
					},
					{
						...attachmentPart,
						ci
					}
				];
				const message = generateMessage({ parts });

				const result = getFlattenedAttachmentParts(message);

				expect(result).toHaveLength(1);
				expect(result[0].disposition).toBe('inline');
			});

			test('if has no disposition and referenced by Text/Html part', () => {
				const ci = '123:456';
				const parts: Array<MailMessagePart> = [
					{
						name: 'body',
						contentType: 'text/html',
						content: `<a href="cid:${ci}"/>`,
						size: 200
					},
					{
						...noDispositionPart,
						ci
					}
				];
				const message = generateMessage({ parts });
				const result = getFlattenedAttachmentParts(message);

				expect(result).toHaveLength(1);
				expect(result[0].disposition).toBe('inline');
			});
		});
		describe('should return part with disposition attachment', () => {
			test('if has disposition attachment and is not referenced in Text/Html part', () => {
				const parts: Array<MailMessagePart> = [
					{
						ci: '123:456',
						...attachmentPart
					},
					{
						name: 'body',
						contentType: 'text/html',
						content: 'This is a body part and there is no CID reference here',
						size: 200
					}
				];
				const message = generateMessage({ parts });
				const result = getFlattenedAttachmentParts(message);

				expect(result).toHaveLength(1);
				expect(result[0].disposition).toBe('attachment');
			});

			test('if has no disposition, has ci, but not referenced in Text/Html part', () => {
				const ci = '123:456';
				const parts: Array<MailMessagePart> = [
					{
						name: 'body',
						contentType: 'text/html',
						content: `<a href="no-reference-buddy"/>`,
						size: 200
					},
					{
						...noDispositionPart,
						ci
					}
				];
				const message = generateMessage({ parts });
				const result = getFlattenedAttachmentParts(message);

				expect(result).toHaveLength(1);
				expect(result[0].disposition).toBe('attachment');
			});

			test('if has no disposition, has ci and referenced in a Non Text/Html part', () => {
				const ci = '123:456';
				const parts: Array<MailMessagePart> = [
					{
						name: 'body',
						contentType: 'text/plain',
						content: `This is plain text body with a link: <a href="cid:${ci}"/>`,
						size: 200
					},
					{
						...noDispositionPart,
						ci
					}
				];
				const message = generateMessage({ parts });
				const result = getFlattenedAttachmentParts(message);

				expect(result).toHaveLength(1);
				expect(result[0].disposition).toBe('attachment');
			});

			// NOTE: The improved CID extraction now finds CIDs even in plain text references.
			// This is a known limitation - we don't distinguish between CIDs in proper HTML tags
			// (img/object/embed) vs plain text references. The CID is found and marked as inline.
			test('if has no disposition, has ci and referenced in a Text/Html part without a anchor href', () => {
				const ci = '123:456';
				const parts: Array<MailMessagePart> = [
					{
						name: 'body',
						contentType: 'text/html',
						content: `This is plain text body with a link: cid:${ci}`,
						size: 200
					},
					{
						...noDispositionPart,
						ci
					}
				];
				const message = generateMessage({ parts });
				const result = getFlattenedAttachmentParts(message);

				expect(result).toHaveLength(1);
				// Now correctly finds the CID reference and marks as inline
				expect(result[0].disposition).toBe('inline');
			});

			test('if has disposition, has ci and referenced in a Text/Html part without double quotes', () => {
				const ci = '123:456';
				const parts: Array<MailMessagePart> = [
					{
						name: 'body',
						contentType: 'text/html',
						content: `This is plain text body with a link: cid:${ci}`,
						size: 200
					},
					{
						...attachmentPart,
						ci
					}
				];
				const message = generateMessage({ parts });
				const result = getFlattenedAttachmentParts(message);

				expect(result).toHaveLength(1);
				// Now correctly finds the CID reference and marks as inline
				expect(result[0].disposition).toBe('inline');
			});

			test('if has no disposition, has ci and referenced in a malformed html', () => {
				const ci = '123:456';
				const parts: Array<MailMessagePart> = [
					{
						name: 'body',
						contentType: 'text/html',
						content: `<a href="cid:${ci} >`, // quote not closed
						size: 200
					},
					{
						...noDispositionPart,
						ci
					}
				];
				const message = generateMessage({ parts });
				const result = getFlattenedAttachmentParts(message);

				expect(result).toHaveLength(1);
				// Now correctly finds the CID reference even in malformed HTML
				expect(result[0].disposition).toBe('inline');
			});
		});
		test('Inline attachment without content disposition are recognized anyway', async () => {
			const getMsgResponse = await getMsgSoapApi({ msgId: '13', html: true });
			const messageFromSoap = normalizeMailMessageFromSoap({
				m: getMsgResponse.m[0],
				isComplete: true,
				html: true
			});
			const attachmentParts = getFlattenedAttachmentParts(messageFromSoap);
			expect(attachmentParts).toHaveLength(1);
			expect(attachmentParts[0].name).toBe('2');
			expect(attachmentParts[0].disposition).toBe('inline');
			expect(attachmentParts[0].filename).toBe('image001.jpg');
			expect(attachmentParts[0].ci).toBe('<image001.jpg@01D9CB62.1AADEDA0>');
		});

		describe('returned result', () => {
			it('should include inline images that are referenced by cid even if they lack a filename', () => {
				const ci = 'img123';
				const parts: Array<MailMessagePart> = [
					{
						name: 'body',
						contentType: 'text/html',
						content: `<a href="cid:${ci}"/>`,
						size: 200
					},
					{
						// filename intentionally missing
						name: '2',
						ci,
						disposition: 'inline',
						contentType: 'image/png',
						size: 200
					}
				];
				const message = generateMessage({ parts });
				const result = getFlattenedAttachmentParts(message);

				expect(result).toHaveLength(1);
				expect(result[0].ci).toBe(ci);
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
				const message = generateMessage({ parts });
				const result = getFlattenedAttachmentParts(message);

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
				const message = generateMessage({ parts });
				const result = getFlattenedAttachmentParts(message);

				expect(result).toHaveLength(1);
				expect(result[0].filename).toBe('logo.jpg');
			});

			it('it should return flattened attachments', () => {
				const parts: Array<MailMessagePart> = [
					{
						name: '5',
						contentType: 'multipart/mixed',
						size: 500,
						parts: [
							{
								name: '5.1',
								contentType: 'multipart/related',
								size: 200,
								parts: [
									{
										name: '5.1.1',
										contentType: 'text/plain',
										size: 100
									},
									{
										name: '5.1.2',
										contentType: 'text/html',
										size: 100
									},
									{
										name: '5.1.3',
										disposition: 'attachment',
										contentType: 'image/png',
										size: 100
									}
								]
							},
							{
								name: '5.2',
								disposition: 'attachment',
								contentType: 'application/jpg',
								size: 300
							},
							{
								name: '5.3',
								disposition: 'attachment',
								contentType: 'application/jpeg',
								size: 300
							}
						]
					}
				];
				const message = generateMessage({ parts });
				const result = getFlattenedAttachmentParts(message);

				expect(result).toHaveLength(3);
				expect(result[0].name).toBe('5.1.3');
				expect(result[1].name).toBe('5.2');
				expect(result[2].name).toBe('5.3');
			});

			it('should not omit attachments which do not have disposition', () => {
				const parts: Array<MailMessagePart> = [
					{
						name: '6',
						contentType: 'multipart/mixed',
						size: 500,
						parts: [
							{
								name: '6.2',
								contentType: 'image/jpeg',
								size: 100
							},
							{
								name: '6.3',
								contentType: 'image/png',
								size: 100
							}
						]
					}
				];
				const message = generateMessage({ parts });
				const result = getFlattenedAttachmentParts(message);

				expect(result).toHaveLength(2);
			});

			it('should return an text/html attachment if has disposition', () => {
				const parts: Array<MailMessagePart> = [
					{
						name: 'htmlBody',
						contentType: 'text/html',
						disposition: 'attachment',
						size: 100
					}
				];
				const message = generateMessage({ parts });
				const result = getFlattenedAttachmentParts(message);

				expect(result).toHaveLength(1);
				expect(result[0].name).toBe('htmlBody');
			});

			it('should return an text/plain attachment if has disposition', () => {
				const parts: Array<MailMessagePart> = [
					{
						name: 'plainTextAttachment',
						contentType: 'text/plain',
						disposition: 'inline',
						size: 100
					}
				];
				const message = generateMessage({ parts });
				const result = getFlattenedAttachmentParts(message);

				expect(result).toHaveLength(1);
				expect(result[0].name).toBe('plainTextAttachment');
			});

			it('should return an text/plain attachment if has disposition and parts', () => {
				const parts: Array<MailMessagePart> = [
					{
						name: 'plainTextAttachment',
						contentType: 'text/plain',
						disposition: 'inline',
						size: 100,
						parts: [
							{
								name: '6.3',
								contentType: 'image/png',
								size: 100
							}
						]
					}
				];
				const message = generateMessage({ parts });
				const result = getFlattenedAttachmentParts(message);

				expect(result).toHaveLength(2);
				expect(result[0].name).toBe('plainTextAttachment');
			});

			it('should return an text/html attachment if has disposition and parts', () => {
				const parts: Array<MailMessagePart> = [
					{
						name: 'plainTextAttachment',
						contentType: 'text/html',
						disposition: 'inline',
						size: 100,
						parts: [
							{
								name: '6.3',
								contentType: 'image/png',
								size: 100
							}
						]
					}
				];
				const message = generateMessage({ parts });
				const result = getFlattenedAttachmentParts(message);

				expect(result).toHaveLength(2);
				expect(result[0].name).toBe('plainTextAttachment');
			});

			it('should NOT return body parts as attachments', () => {
				const parts: Array<MailMessagePart> = [
					{
						name: 'body1',
						contentType: 'text/plain',
						size: 100,
						content: 'This is the main body',
						body: true,
						disposition: 'attachment',
						filename: 'should-not-be-attachment.txt'
					},
					{
						name: 'att1',
						contentType: 'application/pdf',
						size: 200,
						disposition: 'attachment',
						filename: 'file.pdf'
					},
					{
						name: 'body2',
						contentType: 'text/html',
						size: 120,
						content: '<b>Body</b>',
						body: true,
						disposition: 'inline',
						filename: 'should-not-be-attachment.html'
					},
					{
						name: 'att2',
						contentType: 'image/png',
						size: 300,
						disposition: 'inline',
						filename: 'image.png'
					}
				];
				const message = generateMessage({ parts });
				const result = getFlattenedAttachmentParts(message);
				// Only real attachments (not body=true) should be returned
				expect(result.length).toBe(2);
				expect(result.some((p) => p.name === 'att1')).toBe(true);
				expect(result.some((p) => p.name === 'att2')).toBe(true);
				expect(result.some((p) => p.name === 'body1')).toBe(false);
				expect(result.some((p) => p.name === 'body2')).toBe(false);
			});
		});
		describe('EML part', () => {
			it('should not return EML attachment if it has no disposition and contains parts', () => {
				const parts: Array<MailMessagePart> = [
					{
						name: 'eml',
						contentType: 'message/rfc822',
						size: 100,
						parts: [
							{
								name: '6.3',
								contentType: 'image/png',
								size: 100
							}
						]
					}
				];
				const message = generateMessage({ parts });
				const result = getFlattenedAttachmentParts(message);

				expect(result).toHaveLength(0);
			});

			// TODO: the two tests below seem a buggy behavior, just documenting the code.
			//  Probably the type definition is not tight so its possible to write code for scenarios that cannot exist
			it('should return EML attachment if it HAS disposition', () => {
				const parts: Array<MailMessagePart> = [
					{
						name: 'eml',
						contentType: 'message/rfc822',
						disposition: 'inline',
						size: 100
					}
				];
				const message = generateMessage({ parts });
				const result = getFlattenedAttachmentParts(message);

				expect(result).toHaveLength(1);
			});
			it('should return EML without its parts if it HAS disposition', () => {
				const parts: Array<MailMessagePart> = [
					{
						name: 'eml',
						contentType: 'message/rfc822',
						disposition: 'inline',
						size: 100,
						parts: [
							{
								name: '6.3',
								contentType: 'image/png',
								size: 100
							}
						]
					}
				];
				const message = generateMessage({ parts });
				const result = getFlattenedAttachmentParts(message);

				expect(result).toHaveLength(1);
				expect(result[0].name).toBe('eml');
			});
			it('should return EML attachment if it has no parts', () => {
				const parts: Array<MailMessagePart> = [
					{
						name: 'eml',
						contentType: 'message/rfc822',
						size: 100
					}
				];
				const message = generateMessage({ parts });
				const result = getFlattenedAttachmentParts(message);

				expect(result).toHaveLength(1);
				expect(result[0].name).toBe('eml');
			});
		});
	});

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
