/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { SoapIncompleteMessage } from 'types/soap/soap-mail-message';
import { extractConvMessage } from 'views/sidebar/commons/use-sync-data-handler';

describe('extractConvMessage', () => {
	it('stores the date and size of conversation hits as numbers', () => {
		// conversation hits of SearchResponse carry d and s as strings
		const hit = {
			id: '1',
			l: '2',
			d: '1793093142000',
			s: '351'
		} as unknown as SoapIncompleteMessage;

		const [message] = extractConvMessage([{ m: [hit] }]);

		expect(message.date).toBe(1793093142000);
		expect(message.size).toBe(351);
	});

	it('leaves the size out when the hit has none', () => {
		// s is sent only for one-message conversations
		const hit = { id: '1', l: '2', d: '1793093142000' } as unknown as SoapIncompleteMessage;

		const [message] = extractConvMessage([{ m: [hit] }]);

		expect(message.size).toBeUndefined();
	});
});
