/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { searchConversationsResponse } from 'api/tests/fixtures/search-conversations-response';
import { extractConvMessage } from 'views/sidebar/commons/use-sync-data-handler';

describe('extractConvMessage', () => {
	const [oneMessageConversation, threeMessagesConversation] = searchConversationsResponse.c;

	it('stores the date and size of conversation hits as numbers', () => {
		const [message] = extractConvMessage([oneMessageConversation]);

		expect(message.date).toBe(1793786269000);
		expect(message.size).toBe(2475);
	});

	it('leaves the size out when the hit has none', () => {
		// s is sent only for one-message conversations
		const messages = extractConvMessage([threeMessagesConversation]);

		expect(messages.map((message) => message.size)).toEqual([undefined, undefined, undefined]);
	});

	it('stores the conversation of each hit, which the hit does not repeat', () => {
		const messages = extractConvMessage(searchConversationsResponse.c);

		expect(messages.map(({ id, conversation }) => [id, conversation])).toEqual([
			['261', '-261'],
			['260', '259'],
			['258', '259'],
			['257', '259']
		]);
	});

	it('stores the time a scheduled draft is sent as a number', () => {
		const [message] = extractConvMessage([
			{
				...oneMessageConversation,
				m: [{ id: '261', l: '6', f: 'sd', d: '1793786269000', autoSendTime: '1793800000000' }]
			}
		]);

		expect(message.autoSendTime).toBe(1793800000000);
		expect(message.isScheduled).toBe(true);
	});
});
