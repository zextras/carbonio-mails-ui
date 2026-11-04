/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import type { GetAttachedMsgResponse } from 'types/soap/get-msg';

// GetMsg of the .eml attached as part 2 of message 262: the message is not an item of the mailbox,
// so it has no cid, l, d nor f, and its date is only the sent date sd; id is the one of the message
// that contains it (ToXML.encodeMessageAsMP with a part, a real response from the test server)
export const getMsgAttachedEmlResponse = {
	m: [
		{
			id: '262',
			part: '2',
			fr: 'See the attached message.',
			e: [
				{ a: 'inner@example.com', d: 'Inner', p: 'Inner Sender', t: 'f' },
				{ a: 'someone@example.com', d: 'Someone', p: 'Someone', t: 't' }
			],
			su: 'Inner message CO-4590',
			mid: '<inner-co-4590@example.com>',
			s: 29,
			sd: 1793604600000,
			_attrs: {
				From: 'Inner Sender <inner@example.com>',
				'Message-Id': '<inner-co-4590@example.com>',
				Date: 'Mon, 02 Nov 2026 08:30:00 +0100'
			},
			mp: [
				{
					part: '2.1',
					ct: 'text/plain',
					s: 29,
					body: true,
					content: 'Body of the attached message.'
				}
			]
		}
	]
} satisfies GetAttachedMsgResponse;
