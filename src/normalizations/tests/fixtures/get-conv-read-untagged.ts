/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import type { SoapConversation } from 'types/soap/soap-conversation';
import type { SoapMailParticipant } from 'types/soap/soap-mail-participant';

const mario: SoapMailParticipant = { a: 'mario@example.com', d: 'Mario', p: 'Mario Rossi', t: 'f' };

// GetConv of a read, untagged conversation: no f, tn nor fr (a real response from the test server)
// Checked without m: the messages of GetConv are not SoapMailMessage (no cid, no mp), see CO-4590
export const getConvReadUntaggedResponse = {
	c: [
		{
			id: '259',
			u: 0,
			n: 2,
			d: 1793612141000,
			su: 'Read untagged thread',
			e: [mario, { a: 'user1@example.com', d: 'user1', t: 't' }],
			m: [
				{
					id: '257',
					d: 1793612140000,
					s: 368,
					su: 'Read untagged thread',
					l: '2',
					fr: 'First message',
					e: [mario]
				},
				{
					id: '258',
					d: 1793612141000,
					s: 511,
					su: 'Re: Read untagged thread',
					l: '2',
					fr: 'Second message',
					e: [mario]
				}
			]
		}
	]
} satisfies { c: Array<Omit<SoapConversation, 'm'> & { m: Array<unknown> }> };
