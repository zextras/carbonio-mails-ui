/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import type { MailsSoapNotify } from 'views/sidebar/commons/types';

// The notification of a reply sent from conversation 259: the copy in Sent (263) is created with its
// cid, the conversation is modified without its messages, and the replied message gets the r flag
// (a real notification from the test server, the folders left out)
export const notifyReplySent = {
	seq: 6,
	created: {
		m: [
			{
				s: 815,
				d: 1793786352000,
				l: '5',
				cid: '259',
				f: 's',
				rev: 7,
				id: '263',
				e: [
					{ a: 'user2@example.com', d: 'user2', t: 't' },
					{ a: 'user1@example.com', d: 'User', p: 'User 1', t: 'f' }
				],
				su: 'Re: Thread CO-4590',
				fr: 'reply from user 1'
			}
		]
	},
	modified: {
		mbx: [{ s: 5547 }],
		c: [
			{
				id: '259',
				u: 3,
				n: 4,
				f: 'srfu',
				e: [
					{ a: 'user2@example.com', d: 'user2', t: 'f' },
					{ a: 'user1@example.com', d: 'User', p: 'User 1', t: 'f' }
				]
			}
		],
		m: [{ f: 'rfu', id: '260' }]
	},
	deleted: []
} satisfies MailsSoapNotify;
