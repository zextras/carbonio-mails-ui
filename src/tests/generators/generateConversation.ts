/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { faker } from '@faker-js/faker';
import { FOLDERS } from '@zextras/carbonio-shell-ui';
import { times } from 'lodash';
import {
	ParticipantRole,
	ParticipantRoleType
} from '../../carbonio-ui-commons/constants/participants';
import { collectParticipantsFromMessages } from '../../helpers/messages';
import type { Conversation, MailMessage, Participant } from '../../types';
import { generateMessage } from './generateMessage';

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
	messages?: Array<MailMessage>;
	messageGenerationCount?: number;
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
	id = faker.datatype.number().toString(),
	folderId = FOLDERS.INBOX,
	receiveDate = faker.date.recent(1).valueOf(),
	to,
	cc,
	from,
	subject = faker.lorem.word(6),
	isRead = false,
	isFlagged = false,
	messages,
	messageGenerationCount = 1
}: ConversationGenerationParams): Conversation => {
	const finalFrom =
		from ??
		(messages && messages.length
			? collectParticipantsFromMessages(messages, ParticipantRole.FROM)
			: generateRandomParticipants(messageGenerationCount, ParticipantRole.FROM));
	const finalTo =
		to ??
		(messages && messages.length
			? collectParticipantsFromMessages(messages, ParticipantRole.TO)
			: generateRandomParticipants(messageGenerationCount, ParticipantRole.TO));
	const finalCc =
		cc ??
		(messages && messages.length
			? collectParticipantsFromMessages(messages, ParticipantRole.CARBON_COPY)
			: generateRandomParticipants(messageGenerationCount, ParticipantRole.CARBON_COPY));
	const finalMessages =
		messages ?? times(messageGenerationCount, () => generateMessage({ folderId }));

	const result = {
		date: receiveDate,
		flagged: isFlagged,
		fragment: '',
		hasAttachment: false,
		id,
		parent: folderId,
		participants: [...finalFrom, ...finalTo, ...finalCc],
		read: isRead,
		subject,
		tags: [],
		urgent: false,
		messages: finalMessages
	};

	return result;
};

export { ConversationGenerationParams, generateConversation };
