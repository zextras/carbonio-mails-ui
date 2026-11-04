/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import type { GetMsgResponse } from 'types/soap/get-msg';

// GetMsg of a message without Subject header and with an empty body: no su nor fr; recipients
// without display name have no p (a real response from the test server)
export const getMsgNoSubjectEmptyBodyResponse = {
	m: [
		{
			s: 325,
			d: 1793612145000,
			l: '2',
			cid: '-260',
			f: 'u',
			rev: 4,
			id: '260',
			e: [
				{ a: 'bare.sender@example.com', d: 'bare', p: 'bare sender', t: 'f' },
				{ a: 'user1@example.com', d: 'user1', t: 't' },
				{ a: 'alice@example.com', d: 'alice', t: 'c' },
				{ a: 'bob@example.com', d: 'bob', t: 'c' }
			],
			mid: '<co-4589-nosubject@example.com>',
			sd: 1793610000000,
			_attrs: {
				From: 'bare.sender@example.com',
				'Message-Id': '<co-4589-nosubject@example.com>',
				Date: 'Mon, 02 Nov 2026 10:00:00 +0100'
			},
			mp: [
				{
					part: '1',
					ct: 'text/plain',
					s: 0,
					body: true,
					content: ''
				}
			]
		}
	]
} satisfies GetMsgResponse;
