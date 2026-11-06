/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import type { GetMsgResponse } from 'types/soap/get-msg';

// GetMsg of a message whose sender has an empty address (From: "Mail Delivery System" <>, as in some
// bounces): its participant has no a (a real response from the test server)
export const getMsgSenderWithoutAddressResponse = {
	m: [
		{
			s: 287,
			d: 1793612178000,
			l: '2',
			cid: '-262',
			f: 'u',
			rev: 6,
			id: '262',
			fr: 'Body',
			e: [
				{ d: 'Mail', p: 'Mail Delivery System', t: 'f' },
				{ a: 'user1@example.com', d: 'user1', t: 't' }
			],
			su: 'Empty address',
			mid: '<co-4589-emptyaddress@example.com>',
			sd: 1793610600000,
			_attrs: {
				From: '"Mail Delivery System" <>',
				'Message-Id': '<co-4589-emptyaddress@example.com>',
				Date: 'Mon, 02 Nov 2026 10:10:00 +0100'
			},
			mp: [
				{
					part: '1',
					ct: 'text/plain',
					s: 6,
					body: true,
					content: 'Body\r\n'
				}
			]
		}
	]
} satisfies GetMsgResponse;
