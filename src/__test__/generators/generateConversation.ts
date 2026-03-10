/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { faker } from '@faker-js/faker';
import { FOLDERS, ParticipantRole, ParticipantRoleType } from '@zextras/carbonio-ui-commons';
import { times } from 'lodash';

import { generateMessage, MessageGenerationParams } from '__test__/generators/generateMessage';
import { updateConversations, updateMessages } from 'store/emails/store';
import { NormalizedConversation } from 'types/conversations';
import { MailMessage } from 'types/messages';
import { Participant } from 'types/participant';

/**
 *
 */
export type ConversationGenerationParams = {
	id?: string;
	folderId?: string;
	from?: Array<Participant>;
	to?: Array<Participant>;
	cc?: Array<Participant>;
	receiveDate?: number;
	fragment?: string;
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
 * @param fragment
 * @param isRead
 * @param isFlagged
 * @param isSingleMessageConversation
 * @param messageIds
 * @param messageGenerationCount
 */
export const generateConversation = ({
	id = faker.number.int().toString(),
	folderId = FOLDERS.INBOX,
	receiveDate = faker.date.recent({ days: 1 }).valueOf(),
	to,
	cc,
	from,
	fragment = '',
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
		fragment,
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
 * MessageGenerationParams take precedence over messageIds. conversationMessagesNumber is the last fallback.
 *
 * It then updates the email store with the generated messages and the corresponding conversation and returns them.
 *
 */
export const populateConversationInEmailStore = ({
	conversationParams,
	messageGeneratorParams,
	messageIds,
	conversationMessagesNumber = 1
}: {
	conversationParams?: ConversationGenerationParams;
	messageGeneratorParams?: Array<MessageGenerationParams>;
	messageIds?: Array<string>;
	conversationMessagesNumber?: number;
} = {}): { conversation: NormalizedConversation; messages: Array<MailMessage> } => {
	const conversationId = conversationParams?.id ?? '1';
	const messagesFromMessageIds = messageIds?.map((messageId) =>
		generateMessage({
			id: messageId,
			folderId: conversationParams?.folderId ?? FOLDERS.INBOX,
			cid: conversationId
		})
	);
	const messagesFromMessageGeneratorParams = messageGeneratorParams?.map((messageGeneratorParam) =>
		generateMessage({ ...messageGeneratorParam, cid: conversationId })
	);
	const conversationMessagesNumberArray = Array.from({ length: conversationMessagesNumber }).map(
		(_, index) => (index + 100).toString()
	);
	const defaultMessages = conversationMessagesNumberArray.map((id) =>
		generateMessage({
			id,
			folderId: conversationParams?.folderId ?? FOLDERS.INBOX,
			cid: conversationId
		})
	);

	const generatedMessages =
		messagesFromMessageIds ?? messagesFromMessageGeneratorParams ?? defaultMessages;
	updateMessages(generatedMessages);

	const generatedConversation = generateConversation({
		...conversationParams,
		id: conversationId,
		messageIds:
			generatedMessages.map((msg) => msg.id) ?? messageIds ?? conversationMessagesNumberArray
	});
	const messagesInConversation =
		messageGeneratorParams?.length ?? messageIds?.length ?? conversationMessagesNumber;
	updateConversations([{ ...generatedConversation, messagesInConversation }]);
	return { conversation: generatedConversation, messages: generatedMessages };
};
