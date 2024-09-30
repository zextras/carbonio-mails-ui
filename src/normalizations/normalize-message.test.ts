/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { normalizeMailMessageFromSoap } from './normalize-message';
import { generateMessageFromAPI } from '../tests/generators/api';

describe('Normalize message', () => {
	describe('Truncated mail part', () => {
		const defaultMailPart = {
			ct: 'text/html',
			part: '0',
			requiresSmartLinkConversion: false
		};

		it('should return a message with truncated false if not defined in soap response', () => {
			const soapIncompleteMessage = generateMessageFromAPI({
				mp: [defaultMailPart]
			});

			const normalizedMessage = normalizeMailMessageFromSoap(soapIncompleteMessage);

			expect(normalizedMessage.parts[0].truncated).toBeFalsy();
		});

		it('should return a message with truncated true', () => {
			const soapIncompleteMessage = generateMessageFromAPI({
				mp: [{ ...defaultMailPart, truncated: true }]
			});

			const normalizedMessage = normalizeMailMessageFromSoap(soapIncompleteMessage);

			expect(normalizedMessage.parts[0].truncated).toBeTruthy();
		});

		it('should return a message with truncated false', () => {
			const soapIncompleteMessage = generateMessageFromAPI({
				mp: [{ ...defaultMailPart, truncated: false }]
			});

			const normalizedMessage = normalizeMailMessageFromSoap(soapIncompleteMessage);

			expect(normalizedMessage.parts[0].truncated).toBeFalsy();
		});
	});
});
