/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { generateMessage } from '../../__test__/generators/generateMessage';
import { retrieveAttachmentsFromMail } from '../index';

describe('Inline image attachments', () => {
	describe('Content-ID matching for inline images', () => {
		it('should mark inline image as cd: "inline" when referenced in HTML body', () => {
			const contentId =
				'26e7f327-15ca-4aab-8806-4775df6cf50f:92ce760b-2ce7-49f5-b470-324890143fc5@carbonio';
			const message = generateMessage({
				parts: [
					{
						contentType: 'multipart/alternative',
						name: '1',
						size: 100,
						parts: [
							{
								contentType: 'text/plain',
								name: '1.1',
								body: true,
								content: 'Plain text version',
								size: 100
							},
							{
								contentType: 'multipart/related',
								name: '2',
								size: 100,
								parts: [
									{
										contentType: 'text/html',
										name: '2.1',
										size: 100,
										body: true,
										content: `<html><body><img src="cid:${contentId}" alt="Screenshot.png"></body></html>`
									},
									{
										contentType: 'image/png',
										name: '2.2',
										cd: 'inline',
										filename: 'Screenshot.png',
										ci: `<${contentId}>`,
										size: 895966
									}
								]
							}
						]
					}
				]
			});
			const attachments = retrieveAttachmentsFromMail(message);
			expect(attachments.inlineAttachments.length).toBe(1);
			expect(attachments.inlineAttachments?.[0]).toEqual(
				expect.objectContaining({
					cd: 'inline',
					ci: `<${contentId}>`,
					filename: 'Screenshot.png',
					contentType: 'image/png'
				})
			);
		});
	});
	// TODO: rewrite these tests according to MailMessagePart type
	it('should return inline image as non-inline attachment when NOT referenced in HTML body', () => {
		const contentId = 'unused-image@carbonio';
		const message = generateMessage({
			parts: [
				{
					contentType: 'multipart/mixed',
					name: '1',
					size: 0,
					parts: [
						{
							contentType: 'text/html',
							name: '1.1',
							body: true,
							content: '<html><body><p>No images here</p></body></html>',
							size: 0
						},
						{
							contentType: 'image/png',
							name: '1.2',
							cd: 'inline',
							filename: 'Unused.png',
							ci: `<${contentId}>`,
							size: 12345
						}
					]
				}
			]
		});
		//
		const attachments = retrieveAttachmentsFromMail(message);

		expect(attachments.blockAttachments).toHaveLength(1);
		expect(attachments.blockAttachments?.[0]).toEqual(
			expect.objectContaining({
				cd: 'attachment',
				ci: `<${contentId}>`,
				filename: 'Unused.png'
			})
		);
	});

	it('should treat inline image with Content-IDs with angle brackets as inline', () => {
		const contentIdInner = 'test-123@domain.com';
		const soapMessage = generateMessage({
			parts: [
				{
					contentType: 'multipart/related',
					name: '1',
					size: 0,
					parts: [
						{
							contentType: 'text/html',
							name: '1.1',
							size: 0,
							body: true,
							content: `<html><body><img src="cid:${contentIdInner}" alt="test"></body></html>`
						},
						{
							contentType: 'image/jpeg',
							name: '1.2',
							cd: 'inline',
							filename: 'test.jpg',
							ci: `<${contentIdInner}>`, // With angle brackets
							size: 5000
						}
					]
				}
			]
		});

		const attachments = retrieveAttachmentsFromMail(soapMessage);

		expect(attachments.blockAttachments).toHaveLength(0);
		expect(attachments.inlineAttachments).toHaveLength(1);
		expect(attachments.inlineAttachments?.[0].cd).toBe('inline');
	});

	it('should treat inline attachment with Content-IDs without angle brackets as inline', () => {
		const contentId = 'simple-id@example.com';
		const soapMessage = generateMessage({
			parts: [
				{
					contentType: 'multipart/related',
					name: '1',
					size: 0,
					parts: [
						{
							contentType: 'text/html',
							size: 0,
							name: '1.1',
							body: true,
							content: `<html><body><img src="cid:${contentId}" alt="animation"></body></html>`
						},
						{
							contentType: 'image/gif',
							name: '1.2',
							cd: 'inline',
							filename: 'animation.gif',
							ci: contentId, // Without angle brackets
							size: 3000
						}
					]
				}
			]
		});

		const attachments = retrieveAttachmentsFromMail(soapMessage);

		expect(attachments.blockAttachments).toHaveLength(0);
		expect(attachments.inlineAttachments).toHaveLength(1);
		expect(attachments.inlineAttachments?.[0].cd).toBe('inline');
	});

	it('should handle multiple inline images in the same email', () => {
		const cid1 = 'image1-uuid:part1@carbonio';
		const cid2 = 'image2-uuid:part2@carbonio';
		const soapMessage = generateMessage({
			parts: [
				{
					contentType: 'multipart/related',
					name: '1',
					size: 0,
					parts: [
						{
							contentType: 'text/html',
							name: '1.1',
							body: true,
							content: `<html><body><img src="cid:${cid1}" alt="image1"><img src="cid:${cid2}" alt="image2"></body></html>`,
							size: 0
						},
						{
							contentType: 'image/png',
							name: '1.2',
							cd: 'inline',
							filename: 'image1.png',
							ci: `<${cid1}>`,
							size: 1000
						},
						{
							contentType: 'image/jpeg',
							name: '1.3',
							cd: 'inline',
							filename: 'image2.jpg',
							ci: `<${cid2}>`,
							size: 2000
						}
					]
				}
			]
		});

		const attachments = retrieveAttachmentsFromMail(soapMessage);

		expect(attachments.blockAttachments).toHaveLength(0);
		expect(attachments.inlineAttachments).toHaveLength(2);
		expect(attachments.inlineAttachments?.[0].cd).toBe('inline');
		expect(attachments.inlineAttachments?.[1].cd).toBe('inline');
	});

	it('should handle mix of inline and regular attachments', () => {
		const inlineCid = 'inline-image@carbonio';
		const soapMessage = generateMessage({
			parts: [
				{
					contentType: 'multipart/mixed',
					name: '1',
					size: 0,
					parts: [
						{
							contentType: 'multipart/related',
							name: '1.1',
							size: 0,
							parts: [
								{
									contentType: 'text/html',
									name: '1.1.1',
									body: true,
									content: `<html><body><img src="cid:${inlineCid}" alt="inline"></body></html>`,
									size: 0
								},
								{
									contentType: 'image/png',
									name: '1.1.2',
									cd: 'inline',
									filename: 'inline.png',
									ci: `<${inlineCid}>`,
									size: 5000
								}
							]
						},
						{
							contentType: 'application/pdf',
							name: '1.2',
							cd: 'attachment',
							filename: 'document.pdf',
							size: 10000
						}
					]
				}
			]
		});

		const attachments = retrieveAttachmentsFromMail(soapMessage);

		expect(attachments.inlineAttachments).toHaveLength(1);
		expect(attachments.blockAttachments).toHaveLength(1);
		const inlineAttachment = attachments.inlineAttachments?.find(
			(a) => a.filename === 'inline.png'
		);
		const regularAttachment = attachments.blockAttachments?.find(
			(a) => a.filename === 'document.pdf'
		);

		expect(inlineAttachment?.filename).toBe('inline.png');
		expect(regularAttachment?.filename).toBe('document.pdf');
	});
	//
	// 	it('should handle Content-IDs with special characters and colons', () => {
	// 		// Test with UUID-style Content-ID that has colons
	// 		const contentId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479:attachment@example.com';
	// 		const soapMessage = generateMessage({
	// 			parts: [
	// 				{
	// 					contentType: 'multipart/related',
	// 					name: '1',
	// 					parts: [
	// 						{
	// 							contentType: 'text/html',
	// 							name: '1.1',
	// 							body: true,
	// 							content: `<html><body><img src="cid:${contentId}" alt="icon"></body></html>`
	// 						},
	// 						{
	// 							contentType: 'image/svg+xml',
	// 							name: '1.2',
	// 							cd: 'inline',
	// 							filename: 'icon.svg',
	// 							ci: `<${contentId}>`,
	// 							size: 800
	// 						}
	// 					]
	// 				}
	// 			]
	// 		});
	//
	// 		const attachments = retrieveAttachmentsFromMail(soapMessage);
	//
	// 		expect(attachments.attachments).toBeDefined();
	// 		expect(attachments.attachments).toHaveLength(1);
	// 		expect(attachments.attachments?.[0]).toEqual(
	// 			expect.objectContaining({
	// 				cd: 'inline',
	// 				ci: `<${contentId}>`,
	// 				filename: 'icon.svg'
	// 			})
	// 		);
	// 	});
	// });
	//
	// describe('HTML entity decoding in CID extraction', () => {
	// 	it('should extract CIDs with HTML entity encoded @ symbol (&#64;)', () => {
	// 		const contentId = 'image123@carbonio.com';
	// 		const soapMessage = generateMessage({
	// 			parts: [
	// 				{
	// 					contentType: 'multipart/related',
	// 					name: '1',
	// 					parts: [
	// 						{
	// 							contentType: 'text/html',
	// 							name: '1.1',
	// 							body: true,
	// 							// Using &#64; for @ symbol (HTML entity)
	// 							content: `<html><body><img src="cid:image123&#64;carbonio.com" alt="test"></body></html>`
	// 						},
	// 						{
	// 							contentType: 'image/png',
	// 							name: '1.2',
	// 							cd: 'inline',
	// 							filename: 'test.png',
	// 							ci: `<${contentId}>`,
	// 							size: 5000
	// 						}
	// 					]
	// 				}
	// 			]
	// 		});
	//
	// 		const attachments = retrieveAttachmentsFromMail(soapMessage);
	//
	// 		expect(attachments.attachments).toBeDefined();
	// 		expect(attachments.attachments).toHaveLength(1);
	// 		// Should be inline because CID matches after HTML entity decoding
	// 		expect(attachments.attachments?.[0].cd).toBe('inline');
	// 		expect(attachments.attachments?.[0].filename).toBe('test.png');
	// 	});
	//
	// 	it('should extract CIDs with multiple HTML entities', () => {
	// 		const contentId = 'test"123@example.com';
	// 		const soapMessage = generateMessage({
	// 			parts: [
	// 				{
	// 					contentType: 'multipart/related',
	// 					name: '1',
	// 					parts: [
	// 						{
	// 							contentType: 'text/html',
	// 							name: '1.1',
	// 							body: true,
	// 							// Using &#34; for " and &#64; for @
	// 							content: `<html><body><img src="cid:test&#34;123&#64;example.com" alt="test"></body></html>`
	// 						},
	// 						{
	// 							contentType: 'image/jpeg',
	// 							name: '1.2',
	// 							cd: 'inline',
	// 							filename: 'photo.jpg',
	// 							ci: `<${contentId}>`,
	// 							size: 8000
	// 						}
	// 					]
	// 				}
	// 			]
	// 		});
	//
	// 		const attachments = retrieveAttachmentsFromMail(soapMessage);
	//
	// 		expect(attachments.attachments).toBeDefined();
	// 		expect(attachments.attachments).toHaveLength(1);
	// 		expect(attachments.attachments?.[0].cd).toBe('inline');
	// 	});
	//
	// 	it('should handle &amp; entity in CIDs', () => {
	// 		const contentId = 'test&data@example.com';
	// 		const soapMessage = generateMessage({
	// 			parts: [
	// 				{
	// 					contentType: 'multipart/related',
	// 					name: '1',
	// 					parts: [
	// 						{
	// 							contentType: 'text/html',
	// 							name: '1.1',
	// 							body: true,
	// 							content: `<html><body><img src="cid:test&amp;data&#64;example.com"></body></html>`
	// 						},
	// 						{
	// 							contentType: 'image/gif',
	// 							name: '1.2',
	// 							cd: 'inline',
	// 							filename: 'animation.gif',
	// 							ci: `<${contentId}>`,
	// 							size: 3000
	// 						}
	// 					]
	// 				}
	// 			]
	// 		});
	//
	// 		const attachments = retrieveAttachmentsFromMail(soapMessage);
	//
	// 		expect(attachments.attachments?.[0].cd).toBe('inline');
	// 	});
	//
	// 	it('should extract CIDs that end with whitespace or tag closure', () => {
	// 		const contentId1 = 'img1@test.com';
	// 		const contentId2 = 'img2@test.com';
	// 		const soapMessage = generateMessage({
	// 			parts: [
	// 				{
	// 					contentType: 'multipart/related',
	// 					name: '1',
	// 					parts: [
	// 						{
	// 							contentType: 'text/html',
	// 							name: '1.1',
	// 							body: true,
	// 							// One ends with space, one ends with >
	// 							content: `<html><body><img src="cid:img1@test.com" /><img src="cid:img2@test.com"></body></html>`
	// 						},
	// 						{
	// 							contentType: 'image/png',
	// 							name: '1.2',
	// 							cd: 'inline',
	// 							filename: 'img1.png',
	// 							ci: `<${contentId1}>`,
	// 							size: 1000
	// 						},
	// 						{
	// 							contentType: 'image/png',
	// 							name: '1.3',
	// 							cd: 'inline',
	// 							filename: 'img2.png',
	// 							ci: `<${contentId2}>`,
	// 							size: 2000
	// 						}
	// 					]
	// 				}
	// 			]
	// 		});
	//
	// 		const attachments = retrieveAttachmentsFromMail(soapMessage);
	//
	// 		expect(attachments.attachments).toHaveLength(2);
	// 		expect(attachments.attachments?.[0].cd).toBe('inline');
	// 		expect(attachments.attachments?.[1].cd).toBe('inline');
	// 	});
	// });
	//
	// describe('Disposition logic with hasHtml flag', () => {
	// 	it('should preserve inline disposition when no HTML content exists (plain text email)', () => {
	// 		const contentId = 'image@example.com';
	// 		const soapMessage = generateMessage({
	// 			parts: [
	// 				{
	// 					contentType: 'multipart/mixed',
	// 					name: '1',
	// 					parts: [
	// 						{
	// 							contentType: 'text/plain',
	// 							name: '1.1',
	// 							body: true,
	// 							content: 'This is a plain text email with no HTML'
	// 						},
	// 						{
	// 							contentType: 'image/png',
	// 							name: '1.2',
	// 							cd: 'inline',
	// 							filename: 'chart.png',
	// 							ci: `<${contentId}>`,
	// 							size: 15000
	// 						}
	// 					]
	// 				}
	// 			]
	// 		});
	//
	// 		const attachments = retrieveAttachmentsFromMail(soapMessage);
	//
	// 		expect(attachments.attachments).toBeDefined();
	// 		expect(attachments.attachments).toHaveLength(1);
	// 		// Should preserve 'inline' because there's no HTML to check against
	// 		expect(attachments.attachments?.[0].cd).toBe('inline');
	// 	});
	//
	// 	it('should change inline to attachment when HTML exists but image not referenced', () => {
	// 		const contentId = 'unused@example.com';
	// 		const soapMessage = generateMessage({
	// 			parts: [
	// 				{
	// 					contentType: 'multipart/mixed',
	// 					name: '1',
	// 					parts: [
	// 						{
	// 							contentType: 'text/html',
	// 							name: '1.1',
	// 							body: true,
	// 							content: '<html><body><p>Email with no embedded images</p></body></html>'
	// 						},
	// 						{
	// 							contentType: 'image/png',
	// 							name: '1.2',
	// 							cd: 'inline',
	// 							filename: 'unused.png',
	// 							ci: `<${contentId}>`,
	// 							size: 5000
	// 						}
	// 					]
	// 				}
	// 			]
	// 		});
	//
	// 		const attachments = retrieveAttachmentsFromMail(soapMessage);
	//
	// 		expect(attachments.attachments).toBeDefined();
	// 		expect(attachments.attachments).toHaveLength(1);
	// 		// Should change to 'attachment' because HTML exists but doesn't reference it
	// 		expect(attachments.attachments?.[0].cd).toBe('attachment');
	// 	});
	//
	// 	it('should handle multipart/alternative with HTML and plain text correctly', () => {
	// 		const contentId = 'logo@company.com';
	// 		const soapMessage = generateMessage({
	// 			parts: [
	// 				{
	// 					contentType: 'multipart/alternative',
	// 					name: '1',
	// 					parts: [
	// 						{
	// 							contentType: 'text/plain',
	// 							name: '1.1',
	// 							body: true,
	// 							content: 'Plain text version'
	// 						},
	// 						{
	// 							contentType: 'multipart/related',
	// 							name: '2',
	// 							parts: [
	// 								{
	// 									contentType: 'text/html',
	// 									name: '2.1',
	// 									body: true,
	// 									content: `<html><body><img src="cid:${contentId}"></body></html>`
	// 								},
	// 								{
	// 									contentType: 'image/png',
	// 									name: '2.2',
	// 									cd: 'inline',
	// 									filename: 'logo.png',
	// 									ci: `<${contentId}>`,
	// 									size: 4000
	// 								}
	// 							]
	// 						}
	// 					]
	// 				}
	// 			]
	// 		});
	//
	// 		const attachments = retrieveAttachmentsFromMail(soapMessage);
	//
	// 		expect(attachments.attachments).toHaveLength(1);
	// 		expect(attachments.attachments?.[0].cd).toBe('inline');
	// 	});
	//
	// 	it('should handle attachments without CIDs correctly', () => {
	// 		const soapMessage = generateMessage({
	// 			parts: [
	// 				{
	// 					contentType: 'multipart/mixed',
	// 					name: '1',
	// 					parts: [
	// 						{
	// 							contentType: 'text/html',
	// 							name: '1.1',
	// 							body: true,
	// 							content: '<html><body><p>Email body</p></body></html>'
	// 						},
	// 						{
	// 							contentType: 'application/pdf',
	// 							name: '1.2',
	// 							cd: 'attachment',
	// 							filename: 'document.pdf',
	// 							size: 50000
	// 						}
	// 					]
	// 				}
	// 			]
	// 		});
	//
	// 		const attachments = retrieveAttachmentsFromMail(soapMessage);
	//
	// 		expect(attachments.attachments).toHaveLength(1);
	// 		expect(attachments.attachments?.[0].cd).toBe('attachment');
	// 		expect(attachments.attachments?.[0].filename).toBe('document.pdf');
	// 	});
	//
	// 	it('should handle items with no cd property by defaulting to attachment', () => {
	// 		const soapMessage = generateMessage({
	// 			parts: [
	// 				{
	// 					contentType: 'multipart/mixed',
	// 					name: '1',
	// 					parts: [
	// 						{
	// 							contentType: 'text/html',
	// 							name: '1.1',
	// 							body: true,
	// 							content: '<html><body>Test</body></html>'
	// 						},
	// 						{
	// 							contentType: 'application/vnd.ms-excel',
	// 							name: '1.2',
	// 							// No cd property specified
	// 							filename: 'spreadsheet.xlsx',
	// 							size: 25000
	// 						}
	// 					]
	// 				}
	// 			]
	// 		});
	//
	// 		const attachments = retrieveAttachmentsFromMail(soapMessage);
	//
	// 		expect(attachments.attachments).toHaveLength(1);
	// 		expect(attachments.attachments?.[0].cd).toBe('attachment');
	// 	});
	//
	// 	it('should correctly identify inline images in complex nested multipart structures', () => {
	// 		const inlineCid = 'signature-logo@company.com';
	// 		const soapMessage = generateMessage({
	// 			parts: [
	// 				{
	// 					contentType: 'multipart/mixed',
	// 					name: '1',
	// 					parts: [
	// 						{
	// 							contentType: 'multipart/alternative',
	// 							name: '1.1',
	// 							parts: [
	// 								{
	// 									contentType: 'text/plain',
	// 									name: '1.1.1',
	// 									body: true,
	// 									content: 'Plain text'
	// 								},
	// 								{
	// 									contentType: 'multipart/related',
	// 									name: '1.1.2',
	// 									parts: [
	// 										{
	// 											contentType: 'text/html',
	// 											name: '1.1.2.1',
	// 											body: true,
	// 											content: `<html><body><p>Email with signature</p><img src="cid:${inlineCid}"></body></html>`
	// 										},
	// 										{
	// 											contentType: 'image/png',
	// 											name: '1.1.2.2',
	// 											cd: 'inline',
	// 											filename: 'signature.png',
	// 											ci: `<${inlineCid}>`,
	// 											size: 3000
	// 										}
	// 									]
	// 								}
	// 							]
	// 						},
	// 						{
	// 							contentType: 'application/pdf',
	// 							name: '1.2',
	// 							cd: 'attachment',
	// 							filename: 'report.pdf',
	// 							size: 100000
	// 						}
	// 					]
	// 				}
	// 			]
	// 		});
	//
	// 		const attachments = retrieveAttachmentsFromMail(soapMessage);
	//
	// 		expect(attachments.attachments).toHaveLength(2);
	// 		const signatureImage = attachments.attachments?.find(
	// 			(a) => a.filename === 'signature.png'
	// 		);
	// 		const pdfAttachment = attachments.attachments?.find((a) => a.filename === 'report.pdf');
	//
	// 		expect(signatureImage?.cd).toBe('inline');
	// 		expect(pdfAttachment?.cd).toBe('attachment');
	// 	});
	// });
	//
	// describe('Ignored attachment types', () => {
	// 	it('should ignore Apple-specific multipart/appledouble attachments', () => {
	// 		const soapMessage = generateMessage({
	// 			parts: [
	// 				{
	// 					contentType: 'multipart/mixed',
	// 					name: '1',
	// 					parts: [
	// 						{
	// 							contentType: 'text/html',
	// 							name: '1.1',
	// 							body: true,
	// 							content: '<html><body>Test</body></html>'
	// 						},
	// 						{
	// 							contentType: 'multipart/appledouble',
	// 							name: '1.2',
	// 							cd: 'attachment',
	// 							filename: 'AppleDouble',
	// 							size: 5000
	// 						},
	// 						{
	// 							contentType: 'application/pdf',
	// 							name: '1.3',
	// 							cd: 'attachment',
	// 							filename: 'document.pdf',
	// 							size: 10000
	// 						}
	// 					]
	// 				}
	// 			]
	// 		});
	//
	// 		const attachments = retrieveAttachmentsFromMail(soapMessage);
	//
	// 		expect(attachments.attachments).toHaveLength(1);
	// 		expect(attachments.attachments?.[0].filename).toBe('document.pdf');
	// 	});
	//
	// 	it('should ignore application/applefile attachments', () => {
	// 		const soapMessage = generateMessage({
	// 			parts: [
	// 				{
	// 					contentType: 'multipart/mixed',
	// 					name: '1',
	// 					parts: [
	// 						{
	// 							contentType: 'text/plain',
	// 							name: '1.1',
	// 							body: true,
	// 							content: 'Test email'
	// 						},
	// 						{
	// 							contentType: 'application/applefile',
	// 							name: '1.2',
	// 							cd: 'attachment',
	// 							filename: 'AppleFile',
	// 							size: 2000
	// 						},
	// 						{
	// 							contentType: 'image/jpeg',
	// 							name: '1.3',
	// 							cd: 'attachment',
	// 							filename: 'photo.jpg',
	// 							size: 8000
	// 						}
	// 					]
	// 				}
	// 			]
	// 		});
	//
	// 		const attachments = retrieveAttachmentsFromMail(soapMessage);
	//
	// 		expect(attachments.attachments).toHaveLength(1);
	// 		expect(attachments.attachments?.[0].filename).toBe('photo.jpg');
	// 	});
	//
	// 	it('should ignore HTML body parts marked as body: true', () => {
	// 		const soapMessage = generateMessage({
	// 			parts: [
	// 				{
	// 					contentType: 'multipart/alternative',
	// 					name: '1',
	// 					parts: [
	// 						{
	// 							contentType: 'text/plain',
	// 							name: '1.1',
	// 							body: true,
	// 							content: 'Plain text version'
	// 						},
	// 						{
	// 							contentType: 'text/html',
	// 							name: '1.2',
	// 							body: true,
	// 							content: '<html><body>HTML version</body></html>'
	// 						}
	// 					]
	// 				}
	// 			]
	// 		});
	//
	// 		const attachments = retrieveAttachmentsFromMail(soapMessage);
	//
	// 		// Should have no attachments since both are body parts
	// 		expect(attachments.attachments).toHaveLength(0);
	// 	});
	//
	// 	it('should ignore plain text body parts marked as body: true', () => {
	// 		const soapMessage = generateMessage({
	// 			parts: [
	// 				{
	// 					contentType: 'text/plain',
	// 					name: '1',
	// 					body: true,
	// 					content: 'Email content'
	// 				}
	// 			]
	// 		});
	//
	// 		const attachments = retrieveAttachmentsFromMail(soapMessage);
	//
	// 		expect(attachments.attachments).toHaveLength(0);
	// 	});
	//
	// 	it('should ignore multipart/digest containers', () => {
	// 		const soapMessage = generateMessage({
	// 			parts: [
	// 				{
	// 					contentType: 'multipart/digest',
	// 					name: '1',
	// 					filename: 'digest.eml',
	// 					size: 50000
	// 				},
	// 				{
	// 					contentType: 'application/zip',
	// 					name: '2',
	// 					cd: 'attachment',
	// 					filename: 'archive.zip',
	// 					size: 10000
	// 				}
	// 			]
	// 		});
	//
	// 		const attachments = retrieveAttachmentsFromMail(soapMessage);
	//
	// 		expect(attachments.attachments).toHaveLength(1);
	// 		expect(attachments.attachments?.[0].filename).toBe('archive.zip');
	// 	});
	//
	// 	it('should ignore parts with ci: "text-body"', () => {
	// 		const soapMessage = generateMessage({
	// 			parts: [
	// 				{
	// 					contentType: 'text/html',
	// 					name: '1',
	// 					ci: 'text-body',
	// 					content: '<html><body>Body content</body></html>'
	// 				},
	// 				{
	// 					contentType: 'application/pdf',
	// 					name: '2',
	// 					cd: 'attachment',
	// 					filename: 'document.pdf',
	// 					size: 20000
	// 				}
	// 			]
	// 		});
	//
	// 		const attachments = retrieveAttachmentsFromMail(soapMessage);
	//
	// 		expect(attachments.attachments).toHaveLength(1);
	// 		expect(attachments.attachments?.[0].filename).toBe('document.pdf');
	// 	});
	//
	// 	it('should ignore text/calendar without filename (embedded invites)', () => {
	// 		const soapMessage = generateMessage({
	// 			parts: [
	// 				{
	// 					contentType: 'multipart/alternative',
	// 					name: '1',
	// 					parts: [
	// 						{
	// 							contentType: 'text/plain',
	// 							name: '1.1',
	// 							body: true,
	// 							content: 'Meeting invitation'
	// 						},
	// 						{
	// 							contentType: 'text/calendar',
	// 							name: '1.2',
	// 							// No filename - this is an embedded calendar invite
	// 							content: 'BEGIN:VCALENDAR...'
	// 						}
	// 					]
	// 				}
	// 			]
	// 		});
	//
	// 		const attachments = retrieveAttachmentsFromMail(soapMessage);
	//
	// 		// Should ignore the calendar part without filename
	// 		expect(attachments.attachments).toHaveLength(0);
	// 	});
	//
	// 	it('should NOT ignore text/calendar WITH filename (attached .ics file)', () => {
	// 		const soapMessage = generateMessage({
	// 			parts: [
	// 				{
	// 					contentType: 'multipart/mixed',
	// 					name: '1',
	// 					parts: [
	// 						{
	// 							contentType: 'text/plain',
	// 							name: '1.1',
	// 							body: true,
	// 							content: 'Please find the calendar invite attached'
	// 						},
	// 						{
	// 							contentType: 'text/calendar',
	// 							name: '1.2',
	// 							filename: 'meeting.ics',
	// 							cd: 'attachment',
	// 							size: 3000
	// 						}
	// 					]
	// 				}
	// 			]
	// 		});
	//
	// 		const attachments = retrieveAttachmentsFromMail(soapMessage);
	//
	// 		// Should include calendar file when it has a filename
	// 		expect(attachments.attachments).toHaveLength(1);
	// 		expect(attachments.attachments?.[0].filename).toBe('meeting.ics');
	// 	});
	//
	// 	it('should filter out application/pkcs7-signature (S/MIME signatures)', () => {
	// 		const soapMessage = generateMessage({
	// 			parts: [
	// 				{
	// 					contentType: 'multipart/signed',
	// 					name: '1',
	// 					parts: [
	// 						{
	// 							contentType: 'text/plain',
	// 							name: '1.1',
	// 							body: true,
	// 							content: 'Signed email'
	// 						},
	// 						{
	// 							contentType: 'application/pkcs7-signature',
	// 							name: '1.2',
	// 							filename: 'smime.p7s',
	// 							cd: 'attachment',
	// 							size: 2000
	// 						}
	// 					]
	// 				}
	// 			]
	// 		});
	//
	// 		const attachments = retrieveAttachmentsFromMail(soapMessage);
	//
	// 		// Should filter out the PKCS7 signature
	// 		expect(attachments.attachments).toHaveLength(0);
	// 	});
	// });
	//
	// describe('Special attachment handling', () => {
	// 	it('should add default filename for message/rfc822 without filename', () => {
	// 		const soapMessage = generateMessage({
	// 			parts: [
	// 				{
	// 					contentType: 'multipart/mixed',
	// 					name: '1',
	// 					parts: [
	// 						{
	// 							contentType: 'text/plain',
	// 							name: '1.1',
	// 							body: true,
	// 							content: 'See forwarded message'
	// 						},
	// 						{
	// 							contentType: 'message/rfc822',
	// 							name: '1.2',
	// 							cd: 'attachment',
	// 							// No filename specified
	// 							size: 15000
	// 						}
	// 					]
	// 				}
	// 			]
	// 		});
	//
	// 		const attachments = retrieveAttachmentsFromMail(soapMessage);
	//
	// 		expect(attachments.attachments).toHaveLength(1);
	// 		expect(attachments.attachments?.[0].filename).toBe('Unknown <message/rfc822>');
	// 		expect(attachments.attachments?.[0].contentType).toBe('message/rfc822');
	// 	});
	//
	// 	it('should preserve original filename for message/rfc822 when provided', () => {
	// 		const soapMessage = generateMessage({
	// 			parts: [
	// 				{
	// 					contentType: 'multipart/mixed',
	// 					name: '1',
	// 					parts: [
	// 						{
	// 							contentType: 'text/html',
	// 							name: '1.1',
	// 							body: true,
	// 							content: '<html><body>Forwarded message</body></html>'
	// 						},
	// 						{
	// 							contentType: 'message/rfc822',
	// 							name: '1.2',
	// 							cd: 'attachment',
	// 							filename: 'Original Email.eml',
	// 							size: 20000
	// 						}
	// 					]
	// 				}
	// 			]
	// 		});
	//
	// 		const attachments = retrieveAttachmentsFromMail(soapMessage);
	//
	// 		expect(attachments.attachments).toHaveLength(1);
	// 		expect(attachments.attachments?.[0].filename).toBe('Original Email.eml');
	// 	});
	// 	it('should update attachments content disposition when inline, has html body, and no content ID', () => {
	// 		const soapMessage = generateMessage({
	// 			parts: [
	// 				{
	// 					contentType: 'text/html',
	// 					name: '1.1',
	// 					body: true,
	// 					content: 'default text'
	// 				},
	// 				{
	// 					contentType: 'application/xml',
	// 					cd: 'inline',
	// 					name: '1',
	// 					filename: 'daticert.xml',
	// 					size: 10
	// 				},
	// 				{
	// 					contentType: 'message/rfc822',
	// 					cd: 'inline',
	// 					name: '1.1',
	// 					filename: 'postacert.eml',
	// 					size: 100,
	// 					parts: [
	// 						{
	// 							contentType: 'application/pdf',
	// 							cd: 'attachment',
	// 							name: '1.1',
	// 							filename: 'pdfname.pdf',
	// 							size: 100
	// 						}
	// 					]
	// 				}
	// 			]
	// 		});
	//
	// 		const normalized = retrieveAttachmentsFromMail(soapMessage);
	//
	// 		expect(normalized.attachments).toHaveLength(2);
	// 		expect(normalized.attachments?.[0].filename).toBe('daticert.xml');
	// 		expect(normalized.attachments?.[1].filename).toBe('postacert.eml');
	// 		expect(normalized.attachments?.[0].cd).toBe('attachment');
	// 		expect(normalized.attachments?.[1].cd).toBe('attachment');
	// 	});
	//
	// 	it('should add default filename for text/html without filename', () => {
	// 		const soapMessage = generateMessage({
	// 			parts: [
	// 				{
	// 					contentType: 'multipart/mixed',
	// 					name: '1',
	// 					parts: [
	// 						{
	// 							contentType: 'text/plain',
	// 							name: '1.1',
	// 							body: true,
	// 							content: 'Email with HTML attachment'
	// 						},
	// 						{
	// 							contentType: 'text/html',
	// 							name: '1.2',
	// 							cd: 'attachment',
	// 							// No filename and not marked as body
	// 							content: '<html><body>Detached HTML</body></html>',
	// 							size: 500
	// 						}
	// 					]
	// 				}
	// 			]
	// 		});
	//
	// 		const attachments = retrieveAttachmentsFromMail(soapMessage);
	//
	// 		expect(attachments.attachments).toHaveLength(1);
	// 		expect(attachments.attachments?.[0].filename).toBe('Unknown <text/html>');
	// 	});
	//
	// 	it('should preserve original filename for text/html when provided', () => {
	// 		const soapMessage = generateMessage({
	// 			parts: [
	// 				{
	// 					contentType: 'multipart/mixed',
	// 					name: '1',
	// 					parts: [
	// 						{
	// 							contentType: 'text/plain',
	// 							name: '1.1',
	// 							body: true,
	// 							content: 'Email content'
	// 						},
	// 						{
	// 							contentType: 'text/html',
	// 							name: '1.2',
	// 							cd: 'attachment',
	// 							filename: 'webpage.html',
	// 							size: 800
	// 						}
	// 					]
	// 				}
	// 			]
	// 		});
	//
	// 		const attachments = retrieveAttachmentsFromMail(soapMessage);
	//
	// 		expect(attachments.attachments).toHaveLength(1);
	// 		expect(attachments.attachments?.[0].filename).toBe('webpage.html');
	// 	});
	// });
	//
	// describe('Edge cases and complex scenarios', () => {
	// 	it('should handle deeply nested multipart structures', () => {
	// 		const soapMessage = generateMessage({
	// 			parts: [
	// 				{
	// 					contentType: 'multipart/mixed',
	// 					name: '1',
	// 					parts: [
	// 						{
	// 							contentType: 'multipart/alternative',
	// 							name: '1.1',
	// 							parts: [
	// 								{
	// 									contentType: 'text/plain',
	// 									name: '1.1.1',
	// 									body: true,
	// 									content: 'Plain'
	// 								},
	// 								{
	// 									contentType: 'multipart/related',
	// 									name: '1.1.2',
	// 									parts: [
	// 										{
	// 											contentType: 'text/html',
	// 											name: '1.1.2.1',
	// 											body: true,
	// 											content: '<html><body>HTML</body></html>'
	// 										},
	// 										{
	// 											contentType: 'image/png',
	// 											name: '1.1.2.2',
	// 											cd: 'inline',
	// 											filename: 'embedded.png',
	// 											ci: '<unused@test.com>',
	// 											size: 3000
	// 										}
	// 									]
	// 								}
	// 							]
	// 						},
	// 						{
	// 							contentType: 'application/pdf',
	// 							name: '1.2',
	// 							cd: 'attachment',
	// 							filename: 'document.pdf',
	// 							size: 50000
	// 						}
	// 					]
	// 				}
	// 			]
	// 		});
	//
	// 		const attachments = retrieveAttachmentsFromMail(soapMessage);
	//
	// 		expect(attachments.attachments).toHaveLength(2);
	// 		const imageAttachment = attachments.attachments?.find(
	// 			(a) => a.filename === 'embedded.png'
	// 		);
	// 		const pdfAttachment = attachments.attachments?.find(
	// 			(a) => a.filename === 'document.pdf'
	// 		);
	//
	// 		expect(imageAttachment?.cd).toBe('attachment'); // Changed because not in HTML
	// 		expect(pdfAttachment?.cd).toBe('attachment');
	// 	});
	//
	// 	it('should handle empty mp array', () => {
	// 		const soapMessage = generateMessage({
	// 			parts: []
	// 		});
	//
	// 		const attachments = retrieveAttachmentsFromMail(soapMessage);
	//
	// 		expect(attachments.attachments).toHaveLength(0);
	// 	});
	//
	// 	it('should handle attachments with all normalized properties', () => {
	// 		const soapMessage = generateMessage({
	// 			parts: [
	// 				{
	// 					contentType: 'multipart/mixed',
	// 					name: '1',
	// 					parts: [
	// 						{
	// 							contentType: 'text/plain',
	// 							name: '1.1',
	// 							body: true,
	// 							content: 'Email'
	// 						},
	// 						{
	// 							contentType: 'application/vnd.ms-excel',
	// 							name: '1.2',
	// 							cd: 'attachment',
	// 							filename: 'spreadsheet.xls',
	// 							size: 45000
	// 						}
	// 					]
	// 				}
	// 			]
	// 		});
	//
	// 		const attachments = retrieveAttachmentsFromMail(soapMessage);
	//
	// 		expect(attachments.attachments).toHaveLength(1);
	// 		const attachment = attachments.attachments?.[0];
	// 		expect(attachment).toEqual(
	// 			expect.objectContaining({
	// 				contentType: 'application/vnd.ms-excel',
	// 				contentType: 'application/vnd.ms-excel',
	// 				name: '1.2',
	// 				name: '1.2',
	// 				size: 45000,
	// 				size: 45000,
	// 				cd: 'attachment',
	// 				filename: 'spreadsheet.xls'
	// 			})
	// 		);
	// 	});
	//
	// 	it('should handle single part attachment (not in array)', () => {
	// 		const soapMessage = generateMessage({
	// 			parts: {
	// 				contentType: 'application/pdf',
	// 				name: '1',
	// 				cd: 'attachment',
	// 				filename: 'document.pdf',
	// 				size: 25000
	// 			} as never // Force single object instead of array
	// 		});
	//
	// 		const attachments = retrieveAttachmentsFromMail(soapMessage);
	//
	// 		expect(attachments.attachments).toHaveLength(1);
	// 		expect(attachments.attachments?.[0].filename).toBe('document.pdf');
	// 	});
	//
	// 	it('should handle attachments without Content-Disposition but with filename', () => {
	// 		const soapMessage = generateMessage({
	// 			parts: [
	// 				{
	// 					contentType: 'multipart/mixed',
	// 					name: '1',
	// 					parts: [
	// 						{
	// 							contentType: 'text/html',
	// 							name: '1.1',
	// 							body: true,
	// 							content: '<html><body>Test</body></html>'
	// 						},
	// 						{
	// 							contentType: 'application/msword',
	// 							name: '1.2',
	// 							// No cd property
	// 							filename: 'report.doc',
	// 							size: 35000
	// 						}
	// 					]
	// 				}
	// 			]
	// 		});
	//
	// 		const attachments = retrieveAttachmentsFromMail(soapMessage);
	//
	// 		expect(attachments.attachments).toHaveLength(1);
	// 		expect(attachments.attachments?.[0].cd).toBe('attachment'); // Defaulted
	// 		expect(attachments.attachments?.[0].filename).toBe('report.doc');
	// 	});
	//
	// 	it('should handle multiple attachments of various types', () => {
	// 		const soapMessage = generateMessage({
	// 			parts: [
	// 				{
	// 					contentType: 'multipart/mixed',
	// 					name: '1',
	// 					parts: [
	// 						{
	// 							contentType: 'text/html',
	// 							name: '1.1',
	// 							body: true,
	// 							content: '<html><body>Email content</body></html>'
	// 						},
	// 						{
	// 							contentType: 'application/pdf',
	// 							name: '1.2',
	// 							cd: 'attachment',
	// 							filename: 'document.pdf',
	// 							size: 50000
	// 						},
	// 						{
	// 							contentType: 'image/jpeg',
	// 							name: '1.3',
	// 							cd: 'attachment',
	// 							filename: 'photo.jpg',
	// 							size: 150000
	// 						},
	// 						{
	// 							contentType: 'application/zip',
	// 							name: '1.4',
	// 							cd: 'attachment',
	// 							filename: 'archive.zip',
	// 							size: 1000000
	// 						},
	// 						{
	// 							contentType: 'message/rfc822',
	// 							name: '1.5',
	// 							cd: 'attachment',
	// 							filename: 'forwarded.eml',
	// 							size: 25000
	// 						}
	// 					]
	// 				}
	// 			]
	// 		});
	//
	// 		const attachments = retrieveAttachmentsFromMail(soapMessage);
	//
	// 		expect(attachments.attachments).toHaveLength(4);
	// 		const filenames = attachments.attachments?.map((a) => a.filename);
	// 		expect(filenames).toContain('document.pdf');
	// 		expect(filenames).toContain('photo.jpg');
	// 		expect(filenames).toContain('archive.zip');
	// 		expect(filenames).toContain('forwarded.eml');
	// 	});
	//
	// 	it('should handle attachment with Content-ID but no HTML body', () => {
	// 		const soapMessage = generateMessage({
	// 			parts: [
	// 				{
	// 					contentType: 'multipart/mixed',
	// 					name: '1',
	// 					parts: [
	// 						{
	// 							contentType: 'text/plain',
	// 							name: '1.1',
	// 							body: true,
	// 							content: 'Plain text email'
	// 						},
	// 						{
	// 							contentType: 'image/png',
	// 							name: '1.2',
	// 							cd: 'inline',
	// 							filename: 'chart.png',
	// 							ci: '<chart@example.com>',
	// 							size: 10000
	// 						}
	// 					]
	// 				}
	// 			]
	// 		});
	//
	// 		const attachments = retrieveAttachmentsFromMail(soapMessage);
	//
	// 		expect(attachments.attachments).toHaveLength(1);
	// 		// Should preserve inline since there's no HTML to contradict it
	// 		expect(attachments.attachments?.[0].cd).toBe('inline');
	// 	});
	// });
});
