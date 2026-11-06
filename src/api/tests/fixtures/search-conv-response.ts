/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import type { SearchConvResponse } from 'types/soap/search-conv';

// SearchConv of a conversation (two of its four messages), as the conversation preview sends it: the server
// answers with sortBy (never orderBy) and offset as a string (a real response from the test
// server; the fields no type declares are left out)
export const searchConvResponse = {
	offset: '0',
	sortBy: 'dateDesc',
	m: [
		{
			// the reply in Sent does not match the query: the server sends it without the headers
			s: 815,
			d: 1793786352000,
			l: '5',
			cid: '259',
			f: 's',
			rev: 7,
			id: '263',
			fr: 'reply from user 1',
			e: [
				{ a: 'user1@example.com', d: 'User', p: 'User 1', t: 'f' },
				{ a: 'user2@example.com', d: 'user2', t: 't' }
			],
			su: 'Re: Thread CO-4590',
			mid: '<558343392.6.1793786352836.JavaMail.zextras@example.com>',
			sd: 1793786352000,
			mp: [{ part: '1', ct: 'text/plain', s: 17, body: true, content: 'reply from user 1' }]
		},
		{
			s: 531,
			d: 1793780400000,
			l: '2',
			cid: '259',
			f: 'rfu',
			rev: 4,
			id: '260',
			fr: 'third',
			su: 'Re: Thread CO-4590',
			mid: '<4cdecc68-9add-4d1b-972c-7126ef985c5b@example.com>',
			sd: 1793780400000,
			_attrs: {
				From: 'user2@example.com',
				'Message-Id': '<4cdecc68-9add-4d1b-972c-7126ef985c5b@example.com>',
				Date: 'Wed, 04 Nov 2026 08:20:00 GMT'
			},
			e: [
				{ a: 'user2@example.com', d: 'user2', t: 'f' },
				{ a: 'user1@example.com', d: 'user1', t: 't' }
			],
			mp: [{ part: '1', ct: 'text/plain', s: 4, body: true, content: 'third' }]
		}
	],
	more: false
} satisfies SearchConvResponse;
