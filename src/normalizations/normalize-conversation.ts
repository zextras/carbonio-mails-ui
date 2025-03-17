/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { filter, isNil, map } from 'lodash';

import { normalizeParticipantsFromSoap } from './normalize-message';
import type { NormalizedConversation, SoapConversation, SoapIncompleteMessage } from '../types';
import { getTagIds } from './utils';

export type NormalizeConversationProps = {
	conversation: SoapConversation;
	messages?: Array<SoapIncompleteMessage>;
};
export const mapToNormalizedConversation = ({
	conversation,
	messages
}: NormalizeConversationProps): NormalizedConversation => {
	const messagesWithCid = conversation?.m ?? filter(messages ?? [], ['cid', conversation?.id]);
	const convMessagesIds = map(messagesWithCid, (msg) => msg.id);
	const tags = getTagIds(conversation.t, conversation.tn);
	// disabling type check on this line because the tags are optional
	// the workaround will be removed once proper type is in place
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore
	return {
		...(tags ? { tags } : {}),
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
