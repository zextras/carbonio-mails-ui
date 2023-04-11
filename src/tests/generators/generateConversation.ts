/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { faker } from '@faker-js/faker';
import { FOLDERS } from '@zextras/carbonio-shell-ui';
import { ParticipantRole } from '../../carbonio-ui-commons/constants/participants';
import { Conversation, Participant } from '../../types';
import { generateMessage } from './generateMessage';

/**
 *
 * @param date
 */
const toUnixTimestamp = (date: Date): number => Math.floor(date.getTime() / 1000);

/**
 *
 */
type ConversationGenerationParams = {
	id?: string;
	folderId?: string;
	from?: Participant;
	to?: Array<Participant>;
	cc?: Array<Participant>;
	receiveDate?: number;
	subject?: string;
	isRead?: boolean;
	isFlagged?: boolean;
	isSingleMessageConversation: boolean;
};

const singleMessage = generateMessage({});

const multipleMessages = [singleMessage, singleMessage, singleMessage];

const generateConversation = ({
	id = faker.datatype.number().toString(),
	folderId = FOLDERS.INBOX,
	receiveDate = toUnixTimestamp(faker.date.recent(1)),
	to = [{ type: ParticipantRole.TO, address: faker.internet.email() }],
	cc = [],
	from = { type: ParticipantRole.FROM, address: faker.internet.email() },
	subject = faker.lorem.word(6),
	isRead = false,
	isFlagged = false,
	isSingleMessageConversation = true
}: ConversationGenerationParams): Conversation => ({
	date: receiveDate,
	flagged: isFlagged,
	fragment: '',
	hasAttachment: false,
	id,
	parent: folderId,
	participants: [from, ...to, ...cc],
	read: isRead,
	subject,
	tags: [],
	urgent: false,
	messages: isSingleMessageConversation ? [singleMessage] : multipleMessages
});

export { ConversationGenerationParams, generateConversation };
