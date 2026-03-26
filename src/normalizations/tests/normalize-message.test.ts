/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { generateMessageFromAPI } from '../../__test__/generators/api';
import {
	normalizeMailMessageFromSoap,
	normalizePartialIncompleteMessageFromSoapNotify
} from '../normalize-message';
import { MailMessagePart } from 'types/messages';
import { SoapMailMessagePart } from 'types/soap/soap-mail-message';

describe('normalize-message.ts', () => {
	describe('Normalize message', () => {
		describe('Truncated mail body part', () => {
			const defaultBodyPart = {
				ct: 'text/html',
				part: '0',
				body: true
			} as SoapMailMessagePart;

			it('should return a message with truncated false if not defined in soap response', () => {
				const soapIncompleteMessage = generateMessageFromAPI({
					mp: [defaultBodyPart]
				});

				const normalizedMessage = normalizeMailMessageFromSoap({
					m: soapIncompleteMessage,
					html: true
				});

				expect(normalizedMessage.body.truncated).toBeFalsy();
			});

			it('should return a message with truncated true', () => {
				const soapIncompleteMessage = generateMessageFromAPI({
					mp: [{ ...defaultBodyPart, truncated: true }]
				});

				const normalizedMessage = normalizeMailMessageFromSoap({
					m: soapIncompleteMessage,
					html: true
				});

				expect(normalizedMessage.body.truncated).toBeTruthy();
			});

			it('should return a message with truncated false', () => {
				const soapIncompleteMessage = generateMessageFromAPI({
					mp: [{ ...defaultBodyPart, truncated: false }]
				});

				const normalizedMessage = normalizeMailMessageFromSoap({
					m: soapIncompleteMessage,
					html: true
				});

				expect(normalizedMessage.body.truncated).toBeFalsy();
			});

			it('should return replyType and origId message when they are available', () => {
				const soapIncompleteMessage = generateMessageFromAPI({
					rt: 'r',
					origid: '123'
				});

				const normalizedMessage = normalizeMailMessageFromSoap({
					m: soapIncompleteMessage,
					html: true
				});

				expect(normalizedMessage.originalId).toBe('123');
				expect(normalizedMessage.replyType).toBe('r');
			});
			it('should order participants by type in ascending order', () => {
				const soapIncompleteMessage = generateMessageFromAPI({
					rt: 'r',
					origid: '123',
					e: [
						{ a: 'a', p: 'name', t: 't' },
						{ a: 'a', p: 'name', t: 'c' },
						{ a: 'a', p: 'name', t: 'b' },
						{ a: 'a', p: 'name', t: 'f' }
					]
				});

				const normalizedMessage = normalizeMailMessageFromSoap({
					m: soapIncompleteMessage,
					html: true
				});
				const expectedResult = [
					expect.objectContaining({ address: 'a', type: 'b' }),
					expect.objectContaining({ address: 'a', type: 'c' }),
					expect.objectContaining({ address: 'a', type: 'f' }),
					expect.objectContaining({ address: 'a', type: 't' })
				];

				expect(normalizedMessage.participants).toEqual(expectedResult);
			});
		});
		describe('Parts normalization', () => {
			const createSoapPart = (
				overrides: Partial<SoapMailMessagePart> = {}
			): SoapMailMessagePart => ({
				ct: 'text/plain',
				part: '1',
				...overrides
			});

			const expectNormalizedPart = (
				part: MailMessagePart | undefined,
				expected: Partial<MailMessagePart>
			): void => {
				expect(part).toEqual(expect.objectContaining(expected));
			};

			describe('flat mail parts', () => {
				it('should set body to false if not specified', () => {
					const part = createSoapPart({
						s: 123,
						cd: 'inline',
						filename: 'file.txt',
						content: 'Hello',
						ci: 'cid:123'
						// body: not specified
					});
					const msg = normalizeMailMessageFromSoap({
						m: { ...generateMessageFromAPI(), mp: [part] },
						html: true
					});
					expectNormalizedPart(msg.parts[0], {
						contentType: 'text/plain',
						size: 123,
						name: '1',
						disposition: 'inline',
						body: false,
						filename: 'file.txt',
						content: 'Hello',
						ci: 'cid:123'
					});
				});

				it('should set body to true if explicitly set', () => {
					const part = createSoapPart({ body: true, s: 50, cd: 'inline' });
					const msg = normalizeMailMessageFromSoap({
						m: { ...generateMessageFromAPI(), mp: [part] },
						html: true
					});
					expectNormalizedPart(msg.parts[0], {
						contentType: 'text/plain',
						size: 50,
						name: '1',
						disposition: 'inline',
						body: true
					});
				});

				it('should default size to 0 if missing', () => {
					const part = createSoapPart({ cd: 'attachment' });
					const msg = normalizeMailMessageFromSoap({
						m: { ...generateMessageFromAPI(), mp: [part] },
						html: true
					});
					expect(msg.parts[0].size).toBe(0);
				});

				it('should handle body: false explicitly', () => {
					const part = createSoapPart({});
					const msg = normalizeMailMessageFromSoap({
						m: { ...generateMessageFromAPI(), mp: [part] },
						html: true
					});
					expect(msg.parts[0].body).toBe(false);
				});
			});

			describe('nested mail parts', () => {
				it('should normalize nested parts correctly', () => {
					const part: SoapMailMessagePart = {
						ct: 'multipart/mixed',
						part: '0',
						mp: [
							createSoapPart({ ct: 'text/html', part: '1.1', s: 10, cd: 'inline', body: true }),

							createSoapPart({ ct: 'text/plain', part: '1.2', s: 5, cd: 'attachment' })
						]
					};
					const msg = normalizeMailMessageFromSoap({
						m: { ...generateMessageFromAPI(), mp: [part] },
						html: true
					});

					expectNormalizedPart(msg.parts[0], {
						contentType: 'multipart/mixed',
						size: 0,
						name: '0',
						body: false,
						parts: expect.any(Array)
					});

					expect(msg.parts[0].parts).toHaveLength(2);

					expectNormalizedPart(msg.parts[0].parts?.[0], {
						contentType: 'text/html',
						name: '1.1',
						body: true
					});
					expectNormalizedPart(msg.parts[0].parts?.[1], {
						contentType: 'text/plain',
						name: '1.2',
						body: false
					});
				});

				it('should deeply normalize nested parts recursively', () => {
					const part: SoapMailMessagePart = {
						ct: 'multipart/related',
						part: '0',
						mp: [
							{
								ct: 'multipart/alternative',
								part: '0.1',
								mp: [
									createSoapPart({ ct: 'text/plain', part: '0.1.1', body: true }),
									createSoapPart({ ct: 'text/html', part: '0.1.2', body: true })
								]
							}
						]
					};

					const msg = normalizeMailMessageFromSoap({
						m: { ...generateMessageFromAPI(), mp: [part] },
						html: true
					});

					const alt = msg.parts[0].parts?.[0];
					expect(alt?.contentType).toBe('multipart/alternative');
					expect(alt?.parts).toHaveLength(2);
					expect(alt?.parts?.[0].name).toBe('0.1.1');
					expect(alt?.parts?.[1].name).toBe('0.1.2');
				});
			});

			describe('edge cases and combinations', () => {
				it('should handle missing optional fields', () => {
					const part = createSoapPart({});
					const msg = normalizeMailMessageFromSoap({
						m: { ...generateMessageFromAPI(), mp: [part] },
						html: true
					});
					expect(msg.parts[0].filename).toBeUndefined();
					expect(msg.parts[0].content).toBeUndefined();
					expect(msg.parts[0].ci).toBeUndefined();
				});

				it('should preserve filename and content fields', () => {
					const part = createSoapPart({ filename: 'doc.pdf', content: 'base64string' });
					const msg = normalizeMailMessageFromSoap({
						m: { ...generateMessageFromAPI(), mp: [part] },
						html: true
					});
					expect(msg.parts[0].filename).toBe('doc.pdf');
					expect(msg.parts[0].content).toBe('base64string');
				});
			});
		});
	});

	describe('Normalize partial soap incomplete message', () => {
		it('should omit fields when not defined', () => {
			const input = {
				id: '111'
			};

			const result = normalizePartialIncompleteMessageFromSoapNotify(input);

			expect(result).toEqual({ id: '111' }); // read flag, since it has a default fallback
		});

		it('should return flag read: true when the flag is empty', () => {
			const result = normalizePartialIncompleteMessageFromSoapNotify({ id: '111', f: '' });
			expect(result).toEqual({
				id: '111',
				flagged: false,
				hasAttachment: false,
				isDeleted: false,
				isDraft: false,
				isForwarded: false,
				isInvite: false,
				isReplied: false,
				isSentByMe: false,
				read: true,
				urgent: false
			});
		});

		describe.each([
			['should not return flag read when the flag is undefined', { id: '111', f: undefined }],
			['should not return flag read when the flag is missing', { id: '111' }]
		])('%s', (_desc, input) => {
			it('returns { id }', () => {
				const result = normalizePartialIncompleteMessageFromSoapNotify(input);
				expect(result).toEqual({ id: '111' });
			});
		});
	});

	describe('Inline image attachments', () => {
		describe('Content-ID matching for inline images', () => {
			it('should mark inline image as cd: "inline" when referenced in HTML body', () => {
				const contentId =
					'26e7f327-15ca-4aab-8806-4775df6cf50f:92ce760b-2ce7-49f5-b470-324890143fc5@carbonio';
				const soapMessage = generateMessageFromAPI({
					mp: [
						{
							ct: 'multipart/alternative',
							part: '1',
							mp: [
								{
									ct: 'text/plain',
									part: '1.1',
									body: true,
									content: 'Plain text version'
								},
								{
									ct: 'multipart/related',
									part: '2',
									mp: [
										{
											ct: 'text/html',
											part: '2.1',
											body: true,
											content: `<html><body><img src="cid:${contentId}" alt="Screenshot.png"></body></html>`
										},
										{
											ct: 'image/png',
											part: '2.2',
											cd: 'inline',
											filename: 'Screenshot.png',
											ci: `<${contentId}>`,
											s: 895966
										}
									]
								}
							]
						}
					]
				});

				const normalizedMessage = normalizeMailMessageFromSoap({ m: soapMessage, html: true });

				expect(normalizedMessage.attachments).toBeDefined();
				expect(normalizedMessage.attachments).toHaveLength(1);
				expect(normalizedMessage.attachments?.[0]).toEqual(
					expect.objectContaining({
						cd: 'inline',
						ci: `<${contentId}>`,
						filename: 'Screenshot.png',
						contentType: 'image/png'
					})
				);
			});

			it('should mark image as cd: "attachment" when NOT referenced in HTML body', () => {
				const contentId = 'unused-image@carbonio';
				const soapMessage = generateMessageFromAPI({
					mp: [
						{
							ct: 'multipart/mixed',
							part: '1',
							mp: [
								{
									ct: 'text/html',
									part: '1.1',
									body: true,
									content: '<html><body><p>No images here</p></body></html>'
								},
								{
									ct: 'image/png',
									part: '1.2',
									cd: 'inline',
									filename: 'Unused.png',
									ci: `<${contentId}>`,
									s: 12345
								}
							]
						}
					]
				});

				const normalizedMessage = normalizeMailMessageFromSoap({ m: soapMessage, html: true });

				expect(normalizedMessage.attachments).toBeDefined();
				expect(normalizedMessage.attachments).toHaveLength(1);
				expect(normalizedMessage.attachments?.[0]).toEqual(
					expect.objectContaining({
						cd: 'attachment', // Changed to attachment because not referenced
						ci: `<${contentId}>`,
						filename: 'Unused.png'
					})
				);
			});

			it('should handle Content-IDs with angle brackets correctly', () => {
				const contentIdInner = 'test-123@domain.com';
				const soapMessage = generateMessageFromAPI({
					mp: [
						{
							ct: 'multipart/related',
							part: '1',
							mp: [
								{
									ct: 'text/html',
									part: '1.1',
									body: true,
									content: `<html><body><img src="cid:${contentIdInner}" alt="test"></body></html>`
								},
								{
									ct: 'image/jpeg',
									part: '1.2',
									cd: 'inline',
									filename: 'test.jpg',
									ci: `<${contentIdInner}>`, // With angle brackets
									s: 5000
								}
							]
						}
					]
				});

				const normalizedMessage = normalizeMailMessageFromSoap({ m: soapMessage, html: true });

				expect(normalizedMessage.attachments).toBeDefined();
				expect(normalizedMessage.attachments).toHaveLength(1);
				expect(normalizedMessage.attachments?.[0].cd).toBe('inline');
			});

			it('should handle Content-IDs without angle brackets', () => {
				const contentId = 'simple-id@example.com';
				const soapMessage = generateMessageFromAPI({
					mp: [
						{
							ct: 'multipart/related',
							part: '1',
							mp: [
								{
									ct: 'text/html',
									part: '1.1',
									body: true,
									content: `<html><body><img src="cid:${contentId}" alt="animation"></body></html>`
								},
								{
									ct: 'image/gif',
									part: '1.2',
									cd: 'inline',
									filename: 'animation.gif',
									ci: contentId, // Without angle brackets
									s: 3000
								}
							]
						}
					]
				});

				const normalizedMessage = normalizeMailMessageFromSoap({ m: soapMessage, html: true });

				expect(normalizedMessage.attachments).toBeDefined();
				expect(normalizedMessage.attachments).toHaveLength(1);
				expect(normalizedMessage.attachments?.[0].cd).toBe('inline');
			});

			it('should handle multiple inline images in the same email', () => {
				const cid1 = 'image1-uuid:part1@carbonio';
				const cid2 = 'image2-uuid:part2@carbonio';
				const soapMessage = generateMessageFromAPI({
					mp: [
						{
							ct: 'multipart/related',
							part: '1',
							mp: [
								{
									ct: 'text/html',
									part: '1.1',
									body: true,
									content: `<html><body><img src="cid:${cid1}" alt="image1"><img src="cid:${cid2}" alt="image2"></body></html>`
								},
								{
									ct: 'image/png',
									part: '1.2',
									cd: 'inline',
									filename: 'image1.png',
									ci: `<${cid1}>`,
									s: 1000
								},
								{
									ct: 'image/jpeg',
									part: '1.3',
									cd: 'inline',
									filename: 'image2.jpg',
									ci: `<${cid2}>`,
									s: 2000
								}
							]
						}
					]
				});

				const normalizedMessage = normalizeMailMessageFromSoap({ m: soapMessage, html: true });

				expect(normalizedMessage.attachments).toBeDefined();
				expect(normalizedMessage.attachments).toHaveLength(2);
				expect(normalizedMessage.attachments?.[0].cd).toBe('inline');
				expect(normalizedMessage.attachments?.[1].cd).toBe('inline');
			});

			it('should handle mix of inline and regular attachments', () => {
				const inlineCid = 'inline-image@carbonio';
				const soapMessage = generateMessageFromAPI({
					mp: [
						{
							ct: 'multipart/mixed',
							part: '1',
							mp: [
								{
									ct: 'multipart/related',
									part: '1.1',
									mp: [
										{
											ct: 'text/html',
											part: '1.1.1',
											body: true,
											content: `<html><body><img src="cid:${inlineCid}" alt="inline"></body></html>`
										},
										{
											ct: 'image/png',
											part: '1.1.2',
											cd: 'inline',
											filename: 'inline.png',
											ci: `<${inlineCid}>`,
											s: 5000
										}
									]
								},
								{
									ct: 'application/pdf',
									part: '1.2',
									cd: 'attachment',
									filename: 'document.pdf',
									s: 10000
								}
							]
						}
					]
				});

				const normalizedMessage = normalizeMailMessageFromSoap({ m: soapMessage, html: true });

				expect(normalizedMessage.attachments).toBeDefined();
				expect(normalizedMessage.attachments).toHaveLength(2);
				const inlineAttachment = normalizedMessage.attachments?.find(
					(a) => a.filename === 'inline.png'
				);
				const regularAttachment = normalizedMessage.attachments?.find(
					(a) => a.filename === 'document.pdf'
				);

				expect(inlineAttachment?.cd).toBe('inline');
				expect(regularAttachment?.cd).toBe('attachment');
			});

			it('should handle Content-IDs with special characters and colons', () => {
				// Test with UUID-style Content-ID that has colons
				const contentId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479:attachment@example.com';
				const soapMessage = generateMessageFromAPI({
					mp: [
						{
							ct: 'multipart/related',
							part: '1',
							mp: [
								{
									ct: 'text/html',
									part: '1.1',
									body: true,
									content: `<html><body><img src="cid:${contentId}" alt="icon"></body></html>`
								},
								{
									ct: 'image/svg+xml',
									part: '1.2',
									cd: 'inline',
									filename: 'icon.svg',
									ci: `<${contentId}>`,
									s: 800
								}
							]
						}
					]
				});

				const normalizedMessage = normalizeMailMessageFromSoap({ m: soapMessage, html: true });

				expect(normalizedMessage.attachments).toBeDefined();
				expect(normalizedMessage.attachments).toHaveLength(1);
				expect(normalizedMessage.attachments?.[0]).toEqual(
					expect.objectContaining({
						cd: 'inline',
						ci: `<${contentId}>`,
						filename: 'icon.svg'
					})
				);
			});
		});

		describe('HTML entity decoding in CID extraction', () => {
			it('should extract CIDs with HTML entity encoded @ symbol (&#64;)', () => {
				const contentId = 'image123@carbonio.com';
				const soapMessage = generateMessageFromAPI({
					mp: [
						{
							ct: 'multipart/related',
							part: '1',
							mp: [
								{
									ct: 'text/html',
									part: '1.1',
									body: true,
									// Using &#64; for @ symbol (HTML entity)
									content: `<html><body><img src="cid:image123&#64;carbonio.com" alt="test"></body></html>`
								},
								{
									ct: 'image/png',
									part: '1.2',
									cd: 'inline',
									filename: 'test.png',
									ci: `<${contentId}>`,
									s: 5000
								}
							]
						}
					]
				});

				const normalizedMessage = normalizeMailMessageFromSoap({ m: soapMessage, html: true });

				expect(normalizedMessage.attachments).toBeDefined();
				expect(normalizedMessage.attachments).toHaveLength(1);
				// Should be inline because CID matches after HTML entity decoding
				expect(normalizedMessage.attachments?.[0].cd).toBe('inline');
				expect(normalizedMessage.attachments?.[0].filename).toBe('test.png');
			});

			it('should extract CIDs with multiple HTML entities', () => {
				const contentId = 'test"123@example.com';
				const soapMessage = generateMessageFromAPI({
					mp: [
						{
							ct: 'multipart/related',
							part: '1',
							mp: [
								{
									ct: 'text/html',
									part: '1.1',
									body: true,
									// Using &#34; for " and &#64; for @
									content: `<html><body><img src="cid:test&#34;123&#64;example.com" alt="test"></body></html>`
								},
								{
									ct: 'image/jpeg',
									part: '1.2',
									cd: 'inline',
									filename: 'photo.jpg',
									ci: `<${contentId}>`,
									s: 8000
								}
							]
						}
					]
				});

				const normalizedMessage = normalizeMailMessageFromSoap({ m: soapMessage, html: true });

				expect(normalizedMessage.attachments).toBeDefined();
				expect(normalizedMessage.attachments).toHaveLength(1);
				expect(normalizedMessage.attachments?.[0].cd).toBe('inline');
			});

			it('should handle &amp; entity in CIDs', () => {
				const contentId = 'test&data@example.com';
				const soapMessage = generateMessageFromAPI({
					mp: [
						{
							ct: 'multipart/related',
							part: '1',
							mp: [
								{
									ct: 'text/html',
									part: '1.1',
									body: true,
									content: `<html><body><img src="cid:test&amp;data&#64;example.com"></body></html>`
								},
								{
									ct: 'image/gif',
									part: '1.2',
									cd: 'inline',
									filename: 'animation.gif',
									ci: `<${contentId}>`,
									s: 3000
								}
							]
						}
					]
				});

				const normalizedMessage = normalizeMailMessageFromSoap({ m: soapMessage, html: true });

				expect(normalizedMessage.attachments?.[0].cd).toBe('inline');
			});

			it('should extract CIDs that end with whitespace or tag closure', () => {
				const contentId1 = 'img1@test.com';
				const contentId2 = 'img2@test.com';
				const soapMessage = generateMessageFromAPI({
					mp: [
						{
							ct: 'multipart/related',
							part: '1',
							mp: [
								{
									ct: 'text/html',
									part: '1.1',
									body: true,
									// One ends with space, one ends with >
									content: `<html><body><img src="cid:img1@test.com" /><img src="cid:img2@test.com"></body></html>`
								},
								{
									ct: 'image/png',
									part: '1.2',
									cd: 'inline',
									filename: 'img1.png',
									ci: `<${contentId1}>`,
									s: 1000
								},
								{
									ct: 'image/png',
									part: '1.3',
									cd: 'inline',
									filename: 'img2.png',
									ci: `<${contentId2}>`,
									s: 2000
								}
							]
						}
					]
				});

				const normalizedMessage = normalizeMailMessageFromSoap({ m: soapMessage, html: true });

				expect(normalizedMessage.attachments).toHaveLength(2);
				expect(normalizedMessage.attachments?.[0].cd).toBe('inline');
				expect(normalizedMessage.attachments?.[1].cd).toBe('inline');
			});
		});

		describe('Disposition logic with hasHtml flag', () => {
			it('should preserve inline disposition when no HTML content exists (plain text email)', () => {
				const contentId = 'image@example.com';
				const soapMessage = generateMessageFromAPI({
					mp: [
						{
							ct: 'multipart/mixed',
							part: '1',
							mp: [
								{
									ct: 'text/plain',
									part: '1.1',
									body: true,
									content: 'This is a plain text email with no HTML'
								},
								{
									ct: 'image/png',
									part: '1.2',
									cd: 'inline',
									filename: 'chart.png',
									ci: `<${contentId}>`,
									s: 15000
								}
							]
						}
					]
				});

				const normalizedMessage = normalizeMailMessageFromSoap({ m: soapMessage, html: true });

				expect(normalizedMessage.attachments).toBeDefined();
				expect(normalizedMessage.attachments).toHaveLength(1);
				// Should preserve 'inline' because there's no HTML to check against
				expect(normalizedMessage.attachments?.[0].cd).toBe('inline');
			});

			it('should change inline to attachment when HTML exists but image not referenced', () => {
				const contentId = 'unused@example.com';
				const soapMessage = generateMessageFromAPI({
					mp: [
						{
							ct: 'multipart/mixed',
							part: '1',
							mp: [
								{
									ct: 'text/html',
									part: '1.1',
									body: true,
									content: '<html><body><p>Email with no embedded images</p></body></html>'
								},
								{
									ct: 'image/png',
									part: '1.2',
									cd: 'inline',
									filename: 'unused.png',
									ci: `<${contentId}>`,
									s: 5000
								}
							]
						}
					]
				});

				const normalizedMessage = normalizeMailMessageFromSoap({ m: soapMessage, html: true });

				expect(normalizedMessage.attachments).toBeDefined();
				expect(normalizedMessage.attachments).toHaveLength(1);
				// Should change to 'attachment' because HTML exists but doesn't reference it
				expect(normalizedMessage.attachments?.[0].cd).toBe('attachment');
			});

			it('should handle multipart/alternative with HTML and plain text correctly', () => {
				const contentId = 'logo@company.com';
				const soapMessage = generateMessageFromAPI({
					mp: [
						{
							ct: 'multipart/alternative',
							part: '1',
							mp: [
								{
									ct: 'text/plain',
									part: '1.1',
									body: true,
									content: 'Plain text version'
								},
								{
									ct: 'multipart/related',
									part: '2',
									mp: [
										{
											ct: 'text/html',
											part: '2.1',
											body: true,
											content: `<html><body><img src="cid:${contentId}"></body></html>`
										},
										{
											ct: 'image/png',
											part: '2.2',
											cd: 'inline',
											filename: 'logo.png',
											ci: `<${contentId}>`,
											s: 4000
										}
									]
								}
							]
						}
					]
				});

				const normalizedMessage = normalizeMailMessageFromSoap({ m: soapMessage, html: true });

				expect(normalizedMessage.attachments).toHaveLength(1);
				expect(normalizedMessage.attachments?.[0].cd).toBe('inline');
			});

			it('should handle attachments without CIDs correctly', () => {
				const soapMessage = generateMessageFromAPI({
					mp: [
						{
							ct: 'multipart/mixed',
							part: '1',
							mp: [
								{
									ct: 'text/html',
									part: '1.1',
									body: true,
									content: '<html><body><p>Email body</p></body></html>'
								},
								{
									ct: 'application/pdf',
									part: '1.2',
									cd: 'attachment',
									filename: 'document.pdf',
									s: 50000
								}
							]
						}
					]
				});

				const normalizedMessage = normalizeMailMessageFromSoap({ m: soapMessage, html: true });

				expect(normalizedMessage.attachments).toHaveLength(1);
				expect(normalizedMessage.attachments?.[0].cd).toBe('attachment');
				expect(normalizedMessage.attachments?.[0].filename).toBe('document.pdf');
			});

			it('should handle items with no cd property by defaulting to attachment', () => {
				const soapMessage = generateMessageFromAPI({
					mp: [
						{
							ct: 'multipart/mixed',
							part: '1',
							mp: [
								{
									ct: 'text/html',
									part: '1.1',
									body: true,
									content: '<html><body>Test</body></html>'
								},
								{
									ct: 'application/vnd.ms-excel',
									part: '1.2',
									// No cd property specified
									filename: 'spreadsheet.xlsx',
									s: 25000
								}
							]
						}
					]
				});

				const normalizedMessage = normalizeMailMessageFromSoap({ m: soapMessage, html: true });

				expect(normalizedMessage.attachments).toHaveLength(1);
				expect(normalizedMessage.attachments?.[0].cd).toBe('attachment');
			});

			it('should correctly identify inline images in complex nested multipart structures', () => {
				const inlineCid = 'signature-logo@company.com';
				const soapMessage = generateMessageFromAPI({
					mp: [
						{
							ct: 'multipart/mixed',
							part: '1',
							mp: [
								{
									ct: 'multipart/alternative',
									part: '1.1',
									mp: [
										{
											ct: 'text/plain',
											part: '1.1.1',
											body: true,
											content: 'Plain text'
										},
										{
											ct: 'multipart/related',
											part: '1.1.2',
											mp: [
												{
													ct: 'text/html',
													part: '1.1.2.1',
													body: true,
													content: `<html><body><p>Email with signature</p><img src="cid:${inlineCid}"></body></html>`
												},
												{
													ct: 'image/png',
													part: '1.1.2.2',
													cd: 'inline',
													filename: 'signature.png',
													ci: `<${inlineCid}>`,
													s: 3000
												}
											]
										}
									]
								},
								{
									ct: 'application/pdf',
									part: '1.2',
									cd: 'attachment',
									filename: 'report.pdf',
									s: 100000
								}
							]
						}
					]
				});

				const normalizedMessage = normalizeMailMessageFromSoap({ m: soapMessage, html: true });

				expect(normalizedMessage.attachments).toHaveLength(2);
				const signatureImage = normalizedMessage.attachments?.find(
					(a) => a.filename === 'signature.png'
				);
				const pdfAttachment = normalizedMessage.attachments?.find(
					(a) => a.filename === 'report.pdf'
				);

				expect(signatureImage?.cd).toBe('inline');
				expect(pdfAttachment?.cd).toBe('attachment');
			});
		});

		describe('Ignored attachment types', () => {
			it('should ignore Apple-specific multipart/appledouble attachments', () => {
				const soapMessage = generateMessageFromAPI({
					mp: [
						{
							ct: 'multipart/mixed',
							part: '1',
							mp: [
								{
									ct: 'text/html',
									part: '1.1',
									body: true,
									content: '<html><body>Test</body></html>'
								},
								{
									ct: 'multipart/appledouble',
									part: '1.2',
									cd: 'attachment',
									filename: 'AppleDouble',
									s: 5000
								},
								{
									ct: 'application/pdf',
									part: '1.3',
									cd: 'attachment',
									filename: 'document.pdf',
									s: 10000
								}
							]
						}
					]
				});

				const normalizedMessage = normalizeMailMessageFromSoap({ m: soapMessage, html: true });

				expect(normalizedMessage.attachments).toHaveLength(1);
				expect(normalizedMessage.attachments?.[0].filename).toBe('document.pdf');
			});

			it('should ignore application/applefile attachments', () => {
				const soapMessage = generateMessageFromAPI({
					mp: [
						{
							ct: 'multipart/mixed',
							part: '1',
							mp: [
								{
									ct: 'text/plain',
									part: '1.1',
									body: true,
									content: 'Test email'
								},
								{
									ct: 'application/applefile',
									part: '1.2',
									cd: 'attachment',
									filename: 'AppleFile',
									s: 2000
								},
								{
									ct: 'image/jpeg',
									part: '1.3',
									cd: 'attachment',
									filename: 'photo.jpg',
									s: 8000
								}
							]
						}
					]
				});

				const normalizedMessage = normalizeMailMessageFromSoap({ m: soapMessage, html: true });

				expect(normalizedMessage.attachments).toHaveLength(1);
				expect(normalizedMessage.attachments?.[0].filename).toBe('photo.jpg');
			});

			it('should ignore HTML body parts marked as body: true', () => {
				const soapMessage = generateMessageFromAPI({
					mp: [
						{
							ct: 'multipart/alternative',
							part: '1',
							mp: [
								{
									ct: 'text/plain',
									part: '1.1',
									body: true,
									content: 'Plain text version'
								},
								{
									ct: 'text/html',
									part: '1.2',
									body: true,
									content: '<html><body>HTML version</body></html>'
								}
							]
						}
					]
				});

				const normalizedMessage = normalizeMailMessageFromSoap({ m: soapMessage, html: true });

				// Should have no attachments since both are body parts
				expect(normalizedMessage.attachments).toHaveLength(0);
			});

			it('should ignore plain text body parts marked as body: true', () => {
				const soapMessage = generateMessageFromAPI({
					mp: [
						{
							ct: 'text/plain',
							part: '1',
							body: true,
							content: 'Email content'
						}
					]
				});

				const normalizedMessage = normalizeMailMessageFromSoap({ m: soapMessage, html: true });

				expect(normalizedMessage.attachments).toHaveLength(0);
			});

			it('should ignore multipart/digest containers', () => {
				const soapMessage = generateMessageFromAPI({
					mp: [
						{
							ct: 'multipart/digest',
							part: '1',
							filename: 'digest.eml',
							s: 50000
						},
						{
							ct: 'application/zip',
							part: '2',
							cd: 'attachment',
							filename: 'archive.zip',
							s: 10000
						}
					]
				});

				const normalizedMessage = normalizeMailMessageFromSoap({ m: soapMessage, html: true });

				expect(normalizedMessage.attachments).toHaveLength(1);
				expect(normalizedMessage.attachments?.[0].filename).toBe('archive.zip');
			});

			it('should ignore parts with ci: "text-body"', () => {
				const soapMessage = generateMessageFromAPI({
					mp: [
						{
							ct: 'text/html',
							part: '1',
							ci: 'text-body',
							content: '<html><body>Body content</body></html>'
						},
						{
							ct: 'application/pdf',
							part: '2',
							cd: 'attachment',
							filename: 'document.pdf',
							s: 20000
						}
					]
				});

				const normalizedMessage = normalizeMailMessageFromSoap({ m: soapMessage, html: true });

				expect(normalizedMessage.attachments).toHaveLength(1);
				expect(normalizedMessage.attachments?.[0].filename).toBe('document.pdf');
			});

			it('should ignore text/calendar without filename (embedded invites)', () => {
				const soapMessage = generateMessageFromAPI({
					mp: [
						{
							ct: 'multipart/alternative',
							part: '1',
							mp: [
								{
									ct: 'text/plain',
									part: '1.1',
									body: true,
									content: 'Meeting invitation'
								},
								{
									ct: 'text/calendar',
									part: '1.2',
									// No filename - this is an embedded calendar invite
									content: 'BEGIN:VCALENDAR...'
								}
							]
						}
					]
				});

				const normalizedMessage = normalizeMailMessageFromSoap({ m: soapMessage, html: true });

				// Should ignore the calendar part without filename
				expect(normalizedMessage.attachments).toHaveLength(0);
			});

			it('should NOT ignore text/calendar WITH filename (attached .ics file)', () => {
				const soapMessage = generateMessageFromAPI({
					mp: [
						{
							ct: 'multipart/mixed',
							part: '1',
							mp: [
								{
									ct: 'text/plain',
									part: '1.1',
									body: true,
									content: 'Please find the calendar invite attached'
								},
								{
									ct: 'text/calendar',
									part: '1.2',
									filename: 'meeting.ics',
									cd: 'attachment',
									s: 3000
								}
							]
						}
					]
				});

				const normalizedMessage = normalizeMailMessageFromSoap({ m: soapMessage, html: true });

				// Should include calendar file when it has a filename
				expect(normalizedMessage.attachments).toHaveLength(1);
				expect(normalizedMessage.attachments?.[0].filename).toBe('meeting.ics');
			});

			it('should filter out application/pkcs7-signature (S/MIME signatures)', () => {
				const soapMessage = generateMessageFromAPI({
					mp: [
						{
							ct: 'multipart/signed',
							part: '1',
							mp: [
								{
									ct: 'text/plain',
									part: '1.1',
									body: true,
									content: 'Signed email'
								},
								{
									ct: 'application/pkcs7-signature',
									part: '1.2',
									filename: 'smime.p7s',
									cd: 'attachment',
									s: 2000
								}
							]
						}
					]
				});

				const normalizedMessage = normalizeMailMessageFromSoap({ m: soapMessage, html: true });

				// Should filter out the PKCS7 signature
				expect(normalizedMessage.attachments).toHaveLength(0);
			});
		});

		describe('Special attachment handling', () => {
			it('should add default filename for message/rfc822 without filename', () => {
				const soapMessage = generateMessageFromAPI({
					mp: [
						{
							ct: 'multipart/mixed',
							part: '1',
							mp: [
								{
									ct: 'text/plain',
									part: '1.1',
									body: true,
									content: 'See forwarded message'
								},
								{
									ct: 'message/rfc822',
									part: '1.2',
									cd: 'attachment',
									// No filename specified
									s: 15000
								}
							]
						}
					]
				});

				const normalizedMessage = normalizeMailMessageFromSoap({ m: soapMessage, html: true });

				expect(normalizedMessage.attachments).toHaveLength(1);
				expect(normalizedMessage.attachments?.[0].filename).toBe('Unknown <message/rfc822>');
				expect(normalizedMessage.attachments?.[0].contentType).toBe('message/rfc822');
			});

			it('should preserve original filename for message/rfc822 when provided', () => {
				const soapMessage = generateMessageFromAPI({
					mp: [
						{
							ct: 'multipart/mixed',
							part: '1',
							mp: [
								{
									ct: 'text/html',
									part: '1.1',
									body: true,
									content: '<html><body>Forwarded message</body></html>'
								},
								{
									ct: 'message/rfc822',
									part: '1.2',
									cd: 'attachment',
									filename: 'Original Email.eml',
									s: 20000
								}
							]
						}
					]
				});

				const normalizedMessage = normalizeMailMessageFromSoap({ m: soapMessage, html: true });

				expect(normalizedMessage.attachments).toHaveLength(1);
				expect(normalizedMessage.attachments?.[0].filename).toBe('Original Email.eml');
			});
			it('should update attachments content disposition when inline, has html body, and no content ID', () => {
				const soapMessage = generateMessageFromAPI({
					mp: [
						{
							ct: 'text/html',
							part: '1.1',
							body: true,
							content: 'default text'
						},
						{
							ct: 'application/xml',
							cd: 'inline',
							part: '1',
							filename: 'daticert.xml',
							s: 10
						},
						{
							ct: 'message/rfc822',
							cd: 'inline',
							part: '1.1',
							filename: 'postacert.eml',
							s: 100,
							mp: [
								{
									ct: 'application/pdf',
									cd: 'attachment',
									part: '1.1',
									filename: 'pdfname.pdf',
									s: 100
								}
							]
						}
					]
				});

				const normalized = normalizeMailMessageFromSoap({ m: soapMessage, html: true });

				expect(normalized.attachments).toHaveLength(2);
				expect(normalized.attachments?.[0].filename).toBe('daticert.xml');
				expect(normalized.attachments?.[1].filename).toBe('postacert.eml');
				expect(normalized.attachments?.[0].cd).toBe('attachment');
				expect(normalized.attachments?.[1].cd).toBe('attachment');
			});
			it('should update attachments content disposition when inline, has NO html body, and no content ID', () => {
				const soapMessage = generateMessageFromAPI({
					mp: [
						{
							ct: 'text/plain',
							part: '1.1',
							body: true,
							content: 'default text'
						},
						{
							ct: 'application/xml',
							cd: 'inline',
							part: '1',
							filename: 'daticert.xml',
							s: 10
						},
						{
							ct: 'message/rfc822',
							cd: 'inline',
							part: '1.1',
							filename: 'postacert.eml',
							s: 100,
							mp: [
								{
									ct: 'application/pdf',
									cd: 'attachment',
									part: '1.1',
									filename: 'pdfname.pdf',
									s: 100
								}
							]
						}
					]
				});

				const normalized = normalizeMailMessageFromSoap({ m: soapMessage, html: true });

				expect(normalized.attachments).toHaveLength(2);
				expect(normalized.attachments?.[0].filename).toBe('daticert.xml');
				expect(normalized.attachments?.[1].filename).toBe('postacert.eml');
				expect(normalized.attachments?.[0].cd).toBe('attachment');
				expect(normalized.attachments?.[1].cd).toBe('attachment');
			});

			it('should add default filename for text/html without filename', () => {
				const soapMessage = generateMessageFromAPI({
					mp: [
						{
							ct: 'multipart/mixed',
							part: '1',
							mp: [
								{
									ct: 'text/plain',
									part: '1.1',
									body: true,
									content: 'Email with HTML attachment'
								},
								{
									ct: 'text/html',
									part: '1.2',
									cd: 'attachment',
									// No filename and not marked as body
									content: '<html><body>Detached HTML</body></html>',
									s: 500
								}
							]
						}
					]
				});

				const normalizedMessage = normalizeMailMessageFromSoap({ m: soapMessage, html: true });

				expect(normalizedMessage.attachments).toHaveLength(1);
				expect(normalizedMessage.attachments?.[0].filename).toBe('Unknown <text/html>');
			});

			it('should preserve original filename for text/html when provided', () => {
				const soapMessage = generateMessageFromAPI({
					mp: [
						{
							ct: 'multipart/mixed',
							part: '1',
							mp: [
								{
									ct: 'text/plain',
									part: '1.1',
									body: true,
									content: 'Email content'
								},
								{
									ct: 'text/html',
									part: '1.2',
									cd: 'attachment',
									filename: 'webpage.html',
									s: 800
								}
							]
						}
					]
				});

				const normalizedMessage = normalizeMailMessageFromSoap({ m: soapMessage, html: true });

				expect(normalizedMessage.attachments).toHaveLength(1);
				expect(normalizedMessage.attachments?.[0].filename).toBe('webpage.html');
			});
		});

		describe('Edge cases and complex scenarios', () => {
			it('should handle deeply nested multipart structures', () => {
				const soapMessage = generateMessageFromAPI({
					mp: [
						{
							ct: 'multipart/mixed',
							part: '1',
							mp: [
								{
									ct: 'multipart/alternative',
									part: '1.1',
									mp: [
										{
											ct: 'text/plain',
											part: '1.1.1',
											body: true,
											content: 'Plain'
										},
										{
											ct: 'multipart/related',
											part: '1.1.2',
											mp: [
												{
													ct: 'text/html',
													part: '1.1.2.1',
													body: true,
													content: '<html><body>HTML</body></html>'
												},
												{
													ct: 'image/png',
													part: '1.1.2.2',
													cd: 'inline',
													filename: 'embedded.png',
													ci: '<unused@test.com>',
													s: 3000
												}
											]
										}
									]
								},
								{
									ct: 'application/pdf',
									part: '1.2',
									cd: 'attachment',
									filename: 'document.pdf',
									s: 50000
								}
							]
						}
					]
				});

				const normalizedMessage = normalizeMailMessageFromSoap({ m: soapMessage, html: true });

				expect(normalizedMessage.attachments).toHaveLength(2);
				const imageAttachment = normalizedMessage.attachments?.find(
					(a) => a.filename === 'embedded.png'
				);
				const pdfAttachment = normalizedMessage.attachments?.find(
					(a) => a.filename === 'document.pdf'
				);

				expect(imageAttachment?.cd).toBe('attachment'); // Changed because not in HTML
				expect(pdfAttachment?.cd).toBe('attachment');
			});

			it('should handle empty mp array', () => {
				const soapMessage = generateMessageFromAPI({
					mp: []
				});

				const normalizedMessage = normalizeMailMessageFromSoap({ m: soapMessage, html: true });

				expect(normalizedMessage.attachments).toHaveLength(0);
			});

			it('should handle attachments with all normalized properties', () => {
				const soapMessage = generateMessageFromAPI({
					mp: [
						{
							ct: 'multipart/mixed',
							part: '1',
							mp: [
								{
									ct: 'text/plain',
									part: '1.1',
									body: true,
									content: 'Email'
								},
								{
									ct: 'application/vnd.ms-excel',
									part: '1.2',
									cd: 'attachment',
									filename: 'spreadsheet.xls',
									s: 45000
								}
							]
						}
					]
				});

				const normalizedMessage = normalizeMailMessageFromSoap({ m: soapMessage, html: true });

				expect(normalizedMessage.attachments).toHaveLength(1);
				const attachment = normalizedMessage.attachments?.[0];
				expect(attachment).toEqual(
					expect.objectContaining({
						ct: 'application/vnd.ms-excel',
						contentType: 'application/vnd.ms-excel',
						part: '1.2',
						name: '1.2',
						s: 45000,
						size: 45000,
						cd: 'attachment',
						filename: 'spreadsheet.xls'
					})
				);
			});

			it('should handle single part attachment (not in array)', () => {
				const soapMessage = generateMessageFromAPI({
					mp: {
						ct: 'application/pdf',
						part: '1',
						cd: 'attachment',
						filename: 'document.pdf',
						s: 25000
					} as never // Force single object instead of array
				});

				const normalizedMessage = normalizeMailMessageFromSoap({ m: soapMessage, html: true });

				expect(normalizedMessage.attachments).toHaveLength(1);
				expect(normalizedMessage.attachments?.[0].filename).toBe('document.pdf');
			});

			it('should handle attachments without Content-Disposition but with filename', () => {
				const soapMessage = generateMessageFromAPI({
					mp: [
						{
							ct: 'multipart/mixed',
							part: '1',
							mp: [
								{
									ct: 'text/html',
									part: '1.1',
									body: true,
									content: '<html><body>Test</body></html>'
								},
								{
									ct: 'application/msword',
									part: '1.2',
									// No cd property
									filename: 'report.doc',
									s: 35000
								}
							]
						}
					]
				});

				const normalizedMessage = normalizeMailMessageFromSoap({ m: soapMessage, html: true });

				expect(normalizedMessage.attachments).toHaveLength(1);
				expect(normalizedMessage.attachments?.[0].cd).toBe('attachment'); // Defaulted
				expect(normalizedMessage.attachments?.[0].filename).toBe('report.doc');
			});

			it('should handle multiple attachments of various types', () => {
				const soapMessage = generateMessageFromAPI({
					mp: [
						{
							ct: 'multipart/mixed',
							part: '1',
							mp: [
								{
									ct: 'text/html',
									part: '1.1',
									body: true,
									content: '<html><body>Email content</body></html>'
								},
								{
									ct: 'application/pdf',
									part: '1.2',
									cd: 'attachment',
									filename: 'document.pdf',
									s: 50000
								},
								{
									ct: 'image/jpeg',
									part: '1.3',
									cd: 'attachment',
									filename: 'photo.jpg',
									s: 150000
								},
								{
									ct: 'application/zip',
									part: '1.4',
									cd: 'attachment',
									filename: 'archive.zip',
									s: 1000000
								},
								{
									ct: 'message/rfc822',
									part: '1.5',
									cd: 'attachment',
									filename: 'forwarded.eml',
									s: 25000
								}
							]
						}
					]
				});

				const normalizedMessage = normalizeMailMessageFromSoap({ m: soapMessage, html: true });

				expect(normalizedMessage.attachments).toHaveLength(4);
				const filenames = normalizedMessage.attachments?.map((a) => a.filename);
				expect(filenames).toContain('document.pdf');
				expect(filenames).toContain('photo.jpg');
				expect(filenames).toContain('archive.zip');
				expect(filenames).toContain('forwarded.eml');
			});

			it('should handle attachment with Content-ID but no HTML body', () => {
				const soapMessage = generateMessageFromAPI({
					mp: [
						{
							ct: 'multipart/mixed',
							part: '1',
							mp: [
								{
									ct: 'text/plain',
									part: '1.1',
									body: true,
									content: 'Plain text email'
								},
								{
									ct: 'image/png',
									part: '1.2',
									cd: 'inline',
									filename: 'chart.png',
									ci: '<chart@example.com>',
									s: 10000
								}
							]
						}
					]
				});

				const normalizedMessage = normalizeMailMessageFromSoap({ m: soapMessage, html: true });

				expect(normalizedMessage.attachments).toHaveLength(1);
				// Should preserve inline since there's no HTML to contradict it
				expect(normalizedMessage.attachments?.[0].cd).toBe('inline');
			});
		});
	});
});
