/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { Tags } from '@zextras/carbonio-shell-ui';
import { filter, find, isNil, map } from 'lodash';

import { normalizeParticipantsFromSoap } from './normalize-message';
import { omitBy } from '../commons/utils';
import type { Conversation, SoapConversation, SoapIncompleteMessage } from '../types';

const getTagIdsFromName = (names: string | undefined, tags?: Tags): Array<string | undefined> =>
	map(names?.split(','), (name) =>
		find(tags, { name }) ? find(tags, { name })?.id : `nil:${name}`
	);
const getTagIds = (
	t: string | undefined,
	tn: string | undefined,
	tags?: Tags
): Array<string | undefined> => {
	if (!isNil(t)) {
		return filter(t.split(','), (tag) => tag !== '');
	}
	if (!isNil(tn)) {
		return getTagIdsFromName(tn, tags);
	}
	return [];
};

export type NormalizeConversationProps = {
	c: SoapConversation;
	tags: Tags;
	m?: Array<SoapIncompleteMessage>;
};

export const normalizeConversation = ({
	c,
	m,
	tags
}: NormalizeConversationProps): Partial<Conversation> => {
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
			tags: getTagIds(c.t, c.tn, tags),
			id: c.id,
			date: c.d,
			messages,
			participants: c.e ? map(c.e, normalizeParticipantsFromSoap) : undefined,
			subject: !isNil(c.su) ? c.su : '',
			fragment: c.fr,
			read: !isNil(c.f) ? !/u/.test(c.f) : !(c.u > 0),
			hasAttachment: !isNil(c.f) ? /a/.test(c.f) : undefined,
			flagged: !isNil(c.f) ? /f/.test(c.f) : undefined,
			urgent: !isNil(c.f) ? /!/.test(c.f) : undefined,
			// Number of (nondeleted) messages. messages in trash or spam are in the count
			messagesInConversation: c.n
		},
		isNil
	);
};
