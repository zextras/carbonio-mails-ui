/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { filter, isNil, map, omitBy } from 'lodash';

import { normalizeParticipantsFromSoap } from 'normalizations/normalize-message';
import { getTagIds } from 'normalizations/utils';
import { NormalizedConversation } from 'types/conversations';
import { SoapConversation } from 'types/soap/soap-conversation';
import { SoapIncompleteMessage } from 'types/soap/soap-mail-message';
import { OptionalExcept, SoapPartialConversation } from 'views/sidebar/commons/types';

export type NormalizeConversationProps = {
	conversation: SoapConversation;
	messages?: Array<SoapIncompleteMessage>;
};

export type NormalizePartialConversationProps = {
	conversation: SoapPartialConversation;
};

export type NormalizedPartialConversation = OptionalExcept<NormalizedConversation, 'id'>;
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

function calculateReadFlag(conversation: SoapPartialConversation): boolean | undefined {
	if (!isNil(conversation.f)) return !/u/.test(conversation.f);
	if (conversation.u) return conversation.u <= 0;
	return undefined;
}

const mapToNormalizedPartialConversation = ({
	conversation
}: NormalizePartialConversationProps): NormalizedPartialConversation => {
	// const messagesWithCid = conversation?.m ?? filter(messages ?? [], ['cid', conversation?.id]);
	const convMessagesIds = conversation.m ? map(conversation.m, (msg) => msg.id) : undefined;
	const result = omitBy(
		{
			tags: getTagIds(conversation.t, conversation.tn),
			date: conversation.d,
			messageIds: convMessagesIds,
			participants: conversation.e ? map(conversation.e, normalizeParticipantsFromSoap) : undefined,
			subject: conversation.su,
			fragment: conversation.fr,
			read: calculateReadFlag(conversation),
			hasAttachment: !isNil(conversation.f) ? /a/.test(conversation.f) : undefined,
			flagged: !isNil(conversation.f) ? /f/.test(conversation.f) : undefined,
			urgent: !isNil(conversation.f) ? /!/.test(conversation.f) : undefined,
			// Number of (nondeleted) messages. messages in trash or spam are in the count
			messagesInConversation: conversation.n
		},
		isNil
	);
	return { ...result, id: conversation.id };
};
export const normalizePartialConversations = (
	soapConversations: Array<SoapPartialConversation>
): Array<NormalizedPartialConversation> =>
	map(soapConversations, (conv) => mapToNormalizedPartialConversation({ conversation: conv }));
