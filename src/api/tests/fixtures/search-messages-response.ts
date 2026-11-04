/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import type { SearchMessageHit, SearchResponse } from 'types/soap/search';

// Search of the Inbox by message, as the message list sends it (recip 2, fullConversation 1): summaries
// without parts, headers, message id or send date (ToXML.encodeMessageSummary, a real response
// from the test server)
export const searchMessagesResponse = {
	sortBy: 'dateDesc',
	offset: 0,
	m: [
		{
			s: 2475,
			d: 1793786269000,
			l: '2',
			cid: '-261',
			f: 'u',
			rev: 5,
			id: '261',
			su: 'Sent between users',
			fr: 'hello from user 2',
			cm: true,
			e: [
				{ a: 'user1@example.com', d: 'user1', t: 't' },
				{ a: 'user2@example.com', d: 'User', p: 'User 2', t: 'f' }
			],
			sf: '1793786269000'
		},
		{
			s: 531,
			d: 1793780400000,
			l: '2',
			cid: '259',
			f: 'fu',
			rev: 4,
			id: '260',
			su: 'Re: Thread CO-4590',
			fr: 'third',
			cm: true,
			e: [
				{ a: 'user1@example.com', d: 'user1', t: 't' },
				{ a: 'user2@example.com', d: 'user2', t: 'f' }
			],
			sf: '1793780400000'
		}
	] satisfies Array<SearchMessageHit>,
	more: false
} satisfies SearchResponse;
