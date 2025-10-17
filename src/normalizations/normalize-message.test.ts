/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import {
	normalizeMailMessageFromSoap,
	normalizePartialIncompleteMessageFromSoap
} from 'normalizations/normalize-message';
import { generateMessageFromAPI } from '__test__/generators/api';
import { MailMessagePart, SoapMailMessagePart } from 'types/index.d';

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
		const createSoapPart = (overrides: Partial<SoapMailMessagePart> = {}): SoapMailMessagePart => ({
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
