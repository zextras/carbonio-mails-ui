/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { normalizeMailMessageFromSoap } from './normalize-message';
import { generateMessageFromAPI } from '../tests/generators/api';
import { SoapMailMessagePart } from '../types';

describe('Normalize message', () => {
	describe('Truncated mail body part', () => {
		const defaultBodyPart = {
			ct: 'text/html',
			part: '0',
			body: true,
			requiresSmartLinkConversion: false
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
	});
});
