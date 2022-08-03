/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { getTags } from '@zextras/carbonio-shell-ui';
import { filter, find, isNil, map, omitBy } from 'lodash';
import { Conversation, SoapIncompleteMessage, SoapConversation } from '../types';
import { normalizeParticipantsFromSoap } from './normalize-message';

export const getTagIdsFromName = (names: string | undefined): Array<string | undefined> => {
	const tags = getTags();
	return map(names?.split(','), (name) => find(tags, { name })?.id);
};

export const getTagIds = (
	t: string | undefined,
	tn: string | undefined
): Array<string | undefined> => {
	if (!isNil(t)) {
		return filter(t.split(','), (tag) => tag !== '');
	}
	if (!isNil(tn)) {
		return getTagIdsFromName(tn);
	}
	return [];
};
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
			tags: getTagIds(c.t, c.tn),
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
