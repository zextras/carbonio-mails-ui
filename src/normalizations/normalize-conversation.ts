/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { filter, isNil, map, omitBy } from 'lodash';
import { Conversation } from '../types/conversation';
import { SoapIncompleteMessage } from '../types/soap/soap-mail-message';
import { SoapConversation } from '../types/soap/soap-conversation';
import { normalizeParticipantsFromSoap } from './normalize-message';

export const normalizeConversation = (
	c: SoapConversation,
	m?: Array<SoapIncompleteMessage>
): Partial<Conversation> => {
	const filteredMsgs = c?.m ?? filter(m ?? [], ['cid', c?.id]);
	const messages = filteredMsgs?.length
		? map(filteredMsgs, (msg) => ({
				id: msg.id,
				parent: msg.l,
				date: Number(msg?.d)
		  }))
		: undefined;

	return omitBy(
		{
			tags: !isNil(c.t) ? filter(c.t.split(','), (t) => t !== '') : [],
			id: c.id,
			date: c.d,
			msgCount: c.n,
			unreadMsgCount: c.u,
			messages,
			participants: c.e ? map(c.e, normalizeParticipantsFromSoap) : undefined,
			subject: c.su,
			fragment: c.fr,
			read: !isNil(c.f) ? !/u/.test(c.f) : !(c.u > 0),
			attachment: !isNil(c.f) ? /a/.test(c.f) : undefined,
			flagged: !isNil(c.f) ? /f/.test(c.f) : undefined,
			urgent: !isNil(c.f) ? /!/.test(c.f) : undefined
		},
		isNil
	);
};
