/* eslint-disable sonarjs/no-duplicate-string */
// noinspection HtmlRequiredLangAttribute

/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { generateMessageFromAPI } from '__test__/generators/api';
import {
	normalizeMailMessageFromSoap,
	normalizePartialIncompleteMessageFromSoap
} from 'normalizations/normalize-message';
import { MailMessagePart, SoapMailMessagePart } from 'types/index.d';

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

				const normalizedMessage = normalizeMailMessageFromSoap(soapIncompleteMessage);

				expect(normalizedMessage.body.truncated).toBeFalsy();
			});

			it('should return a message with truncated true', () => {
				const soapIncompleteMessage = generateMessageFromAPI({
					mp: [{ ...defaultBodyPart, truncated: true }]
				});

				const normalizedMessage = normalizeMailMessageFromSoap(soapIncompleteMessage);

				expect(normalizedMessage.body.truncated).toBeTruthy();
			});

			it('should return a message with truncated false', () => {
				const soapIncompleteMessage = generateMessageFromAPI({
					mp: [{ ...defaultBodyPart, truncated: false }]
				});

				const normalizedMessage = normalizeMailMessageFromSoap(soapIncompleteMessage);

				expect(normalizedMessage.body.truncated).toBeFalsy();
			});

			it('should return replyType and origId message when they are available', () => {
				const soapIncompleteMessage = generateMessageFromAPI({
					rt: 'r',
					origid: '123'
				});

				const normalizedMessage = normalizeMailMessageFromSoap(soapIncompleteMessage);

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

				const normalizedMessage = normalizeMailMessageFromSoap(soapIncompleteMessage);
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
					const msg = normalizeMailMessageFromSoap({ ...generateMessageFromAPI(), mp: [part] });
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
					const msg = normalizeMailMessageFromSoap({ ...generateMessageFromAPI(), mp: [part] });
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
					const msg = normalizeMailMessageFromSoap({ ...generateMessageFromAPI(), mp: [part] });
					expect(msg.parts[0].size).toBe(0);
				});

				it('should handle body: false explicitly', () => {
					const part = createSoapPart({});
					const msg = normalizeMailMessageFromSoap({ ...generateMessageFromAPI(), mp: [part] });
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
					const msg = normalizeMailMessageFromSoap({ ...generateMessageFromAPI(), mp: [part] });

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

					const msg = normalizeMailMessageFromSoap({ ...generateMessageFromAPI(), mp: [part] });

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
					const msg = normalizeMailMessageFromSoap({ ...generateMessageFromAPI(), mp: [part] });
					expect(msg.parts[0].filename).toBeUndefined();
					expect(msg.parts[0].content).toBeUndefined();
					expect(msg.parts[0].ci).toBeUndefined();
				});

				it('should preserve filename and content fields', () => {
					const part = createSoapPart({ filename: 'doc.pdf', content: 'base64string' });
					const msg = normalizeMailMessageFromSoap({ ...generateMessageFromAPI(), mp: [part] });
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

			const result = normalizePartialIncompleteMessageFromSoap(input);

			expect(result).toEqual({ id: '111', read: true }); // read flag, since it has a default fallback
		});

		describe.each([
			['should return flag read: true when the flag is empty', { id: '111', f: '' }],
			['should return flag read: true when the flag is undefined', { id: '111', f: undefined }],
			['should return flag read: true when the flag is missing', { id: '111' }]
		])('%s', (_desc, input) => {
			it('returns { id, read: true }', () => {
				const result = normalizePartialIncompleteMessageFromSoap(input);
				expect(result).toEqual({ id: '111', read: true });
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

				const normalizedMessage = normalizeMailMessageFromSoap(soapMessage);

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

				const normalizedMessage = normalizeMailMessageFromSoap(soapMessage);

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

				const normalizedMessage = normalizeMailMessageFromSoap(soapMessage);

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

				const normalizedMessage = normalizeMailMessageFromSoap(soapMessage);

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

				const normalizedMessage = normalizeMailMessageFromSoap(soapMessage);

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

				const normalizedMessage = normalizeMailMessageFromSoap(soapMessage);

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

				const normalizedMessage = normalizeMailMessageFromSoap(soapMessage);

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
	});
});
