/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import type { SearchResponse } from 'types/soap/search';

// Search of the Inbox by conversation, as the conversation list sends it (recip 2, fullConversation 1).
// The messages of a hit carry only id, folder, flags and date, with d and s as strings, s only in a
// conversation of one message and f only when set (SearchResponse.doConvMsgHit, a real response
// from the test server)
export const searchConversationsResponse = {
	sortBy: 'dateDesc',
	offset: 0,
	c: [
		{
			id: '-261',
			u: 1,
			n: 1,
			f: 'u',
			d: 1793786269000,
			su: 'Sent between users',
			fr: 'hello from user 2',
			e: [
				{ a: 'user1@example.com', d: 'User', p: 'User 1', t: 'f' },
				{ a: 'user2@example.com', d: 'user2', t: 't' }
			],
			m: [{ id: '261', s: '2475', l: '2', f: 'u', d: '1793786269000' }],
			sf: '1793786269000'
		},
		{
			id: '259',
			u: 3,
			n: 3,
			f: 'fu',
			d: 1793780400000,
			su: 'Re: Thread CO-4590',
			fr: 'third',
			e: [
				{ a: 'user1@example.com', d: 'user1', t: 'f' },
				{ a: 'user2@example.com', d: 'user2', t: 't' }
			],
			m: [
				{ id: '260', l: '2', f: 'fu', d: '1793780400000' },
				{ id: '258', l: '2', f: 'u', d: '1793779800000' },
				{ id: '257', l: '2', f: 'u', d: '1793779200000' }
			],
			sf: '1793780400000'
		}
	],
	more: false
} satisfies SearchResponse;
