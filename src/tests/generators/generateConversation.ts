/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { faker } from '@faker-js/faker';
import { times } from 'lodash';

import { generateMessage, MessageGenerationParams } from './generateMessage';
import { FOLDERS } from '../../carbonio-ui-commons/constants/folders';
import {
	ParticipantRole,
	ParticipantRoleType
} from '../../carbonio-ui-commons/constants/participants';
import { setConversationsInEmailStore, setMessagesInEmailStore } from '../../store/emails/store';
import type { MailMessage, NormalizedConversation, Participant } from '../../types';

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

/**
 * Populates the email store with a conversation and its associated messages, and returns the generated conversation and messages.
 * The function generates messages based on provided message IDs, message generation parameters, or a default count.
 * It then updates the email store with the generated messages and the corresponding conversation.
 *
 * @param {Object} params - The parameters for populating the conversation in the email store.
 * @param {ConversationGenerationParams} params.conversationParams - The parameters for generating the conversation.
 * @param {number} [params.conversationMessagesNumber=1] - The number of default messages to generate if no message IDs or generation parameters are provided.
 * @param {Array<string>} [params.messageIds] - An array of message IDs to generate messages from. If provided, these will be used to create messages.
 * @param {Array<MessageGenerationParams>} [params.messageGeneratorParams] - An array of message generation parameters. If provided, these will be used to create messages.
 * @returns {Object} - An object containing the generated conversation and messages.
 * @returns {NormalizedConversation} return.conversation - The generated conversation.
 * @returns {Array<MailMessage>} return.messages - The array of generated messages.
 *
 * @example
 * // Example usage:
 * const { conversation, messages } = populateConversationInEmailStore({
 *   conversationParams: { id: 'conv1' },
 *   conversationMessagesNumber: 3,
 *   messageIds: ['msg1', 'msg2'],
 *   messageGeneratorParams: [{ id: 'msg3', folderId: 'inbox', cid: 'conv1' }]
 * });
 */
const populateConversationInEmailStore = ({
	conversationParams,
	conversationMessagesNumber = 1,
	messageIds,
	messageGeneratorParams
}: {
	conversationParams: ConversationGenerationParams;
	conversationMessagesNumber?: number;
	messageIds?: Array<string>;
	messageGeneratorParams?: Array<MessageGenerationParams>;
}): { conversation: NormalizedConversation; messages: Array<MailMessage> } => {
	const messagesFromMessageIds = messageIds?.map((messageId) =>
		generateMessage({ id: messageId, folderId: FOLDERS.INBOX, cid: conversationParams.id })
	);
	const messagesFromMessageGeneratorParams = messageGeneratorParams?.map((messageGeneratorParam) =>
		generateMessage(messageGeneratorParam)
	);
	const defaultMessages = times(conversationMessagesNumber, () =>
		generateMessage({ folderId: FOLDERS.INBOX })
	);

	const generatedMessages =
		messagesFromMessageIds ?? messagesFromMessageGeneratorParams ?? defaultMessages;
	setMessagesInEmailStore(generatedMessages, false);

	const generatedConversation = generateConversation({
		id: conversationParams.id,
		messageIds
	});
	setConversationsInEmailStore([generatedConversation], false);
	return { conversation: generatedConversation, messages: generatedMessages };
};

export {
	type ConversationGenerationParams,
	generateConversation,
	populateConversationInEmailStore
};
