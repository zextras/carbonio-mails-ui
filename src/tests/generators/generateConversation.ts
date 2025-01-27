/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { faker } from '@faker-js/faker';
import { times } from 'lodash';

import { generateMessage } from './generateMessage';
import { FOLDERS } from '../../carbonio-ui-commons/constants/folders';
import {
	ParticipantRole,
	ParticipantRoleType
} from '../../carbonio-ui-commons/constants/participants';
import { setConversationsInEmailStore, setMessagesInEmailStore } from '../../store/emails/store';
import type { NormalizedConversation, Participant } from '../../types';

/**
 *
 */
type ConversationGenerationParams = {
	id?: string;
	folderId?: string;
	from?: Array<Participant>;
	to?: Array<Participant>;
	cc?: Array<Participant>;
	receiveDate?: number;
	subject?: string;
	isRead?: boolean;
	isFlagged?: boolean;
	isSingleMessageConversation?: boolean;
	messageIds?: Array<string>;
	messageGenerationCount?: number;
	tags?: Array<string>;
};

/**
 *
 */
const generateRandomParticipants = (count: number, type: ParticipantRoleType): Array<Participant> =>
	times(count, () => ({
		type,
		address: faker.internet.email()
	}));

/**
 *
 * @param id
 * @param folderId
 * @param receiveDate
 * @param to
 * @param cc
 * @param from
 * @param subject
 * @param isRead
 * @param isFlagged
 * @param isSingleMessageConversation
 * @param messages
 * @param messageGenerationCount
 */
const generateConversation = ({
	id = faker.number.int().toString(),
	folderId = FOLDERS.INBOX,
	receiveDate = faker.date.recent({ days: 1 }).valueOf(),
	to,
	cc,
	from,
	subject = faker.lorem.word(6),
	isRead = false,
	isFlagged = false,
	messageIds,
	messageGenerationCount = 1,
	tags = []
}: ConversationGenerationParams = {}): NormalizedConversation => {
	const finalFrom =
		from ?? generateRandomParticipants(messageGenerationCount, ParticipantRole.FROM);
	const finalTo = to ?? generateRandomParticipants(messageGenerationCount, ParticipantRole.TO);
	const finalCc =
		cc ?? generateRandomParticipants(messageGenerationCount, ParticipantRole.CARBON_COPY);
	const finalMessageIds =
		messageIds ?? times(messageGenerationCount, () => generateMessage({ folderId }).id);

	return {
		date: receiveDate,
		flagged: isFlagged,
		fragment: '',
		hasAttachment: false,
		id,
		participants: [...finalFrom, ...finalTo, ...finalCc],
		read: isRead,
		subject,
		tags,
		urgent: false,
		messageIds: finalMessageIds,
		messagesInConversation: finalMessageIds.length
	};
};

const populateConversationInEmailStore = ({
	conversation,
	messageIds
}: {
	conversation: ConversationGenerationParams;
	messageIds: string[];
}): void => {
	const messages = messageIds.map((messageId) =>
		generateMessage({ id: messageId, folderId: FOLDERS.INBOX, cid: conversation.id })
	);
	setMessagesInEmailStore(messages);

	const generatedConversation = generateConversation({
		id: conversation.id,
		messageIds
	});
	setConversationsInEmailStore([generatedConversation], false);
};

export {
	type ConversationGenerationParams,
	generateConversation,
	populateConversationInEmailStore
};
