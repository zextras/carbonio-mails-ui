/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { filter, find, isNil, map } from 'lodash';

import { normalizeParticipantsFromSoap } from './normalize-message';
import { getTags } from '../carbonio-ui-commons/store/zustand/tags';
import { Tags } from '../carbonio-ui-commons/types/tags';
import type { NormalizedConversation, SoapConversation, SoapIncompleteMessage } from '../types';

const getTagIdsFromName = (names: string | undefined, tags?: Tags): Array<string | undefined> =>
	map(
		(names?.split(',') ?? []).filter((n) => n),
		(name) => (find(tags, { name }) ? find(tags, { name })?.id : `nil:${name}`)
	);
const getTagIds = (t: string | undefined, tn: string | undefined): Array<string | undefined> => {
	const tags = getTags();
	if (!isNil(t)) {
		return filter(t.split(','), (tag) => tag !== '');
	}
	if (!isNil(tn)) {
		return getTagIdsFromName(tn, tags);
	}
	return [];
};

export type NormalizeConversationProps = {
	conversation: SoapConversation;
	messages?: Array<SoapIncompleteMessage>;
};

function removeUndefinedValues<T>(items: (T | undefined)[]): T[] {
	const definedItems: T[] = [];
	items.forEach((item) => {
		if (item) {
			definedItems.push(item);
		}
	});
	return definedItems;
}

export const mapToNormalizedConversation = ({
	conversation,
	messages
}: NormalizeConversationProps): NormalizedConversation => {
	const messagesWithCid = conversation?.m ?? filter(messages ?? [], ['cid', conversation?.id]);
	const convMessagesIds = map(messagesWithCid, (msg) => msg.id);

	return {
		tags: removeUndefinedValues(getTagIds(conversation.t, conversation.tn)),
		id: conversation.id,
		date: conversation.d,
		messageIds: convMessagesIds,
		participants: conversation.e ? map(conversation.e, normalizeParticipantsFromSoap) : [],
		subject: conversation.su,
		fragment: conversation.fr,
		read: !isNil(conversation.f) ? !/u/.test(conversation.f) : conversation.u <= 0,
		hasAttachment: !isNil(conversation.f) ? /a/.test(conversation.f) : false,
		flagged: !isNil(conversation.f) ? /f/.test(conversation.f) : false,
		urgent: !isNil(conversation.f) ? /!/.test(conversation.f) : false,
		// Number of (nondeleted) messages. messages in trash or spam are in the count
		messagesInConversation: conversation.n
	};
};

export const normalizeConversations = (
	soapConversations: Array<SoapConversation>
): Array<NormalizedConversation> =>
	map(soapConversations, (conv) => mapToNormalizedConversation({ conversation: conv }));
