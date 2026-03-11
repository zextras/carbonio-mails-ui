/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { faker } from '@faker-js/faker';
import { FOLDERS, ParticipantRole } from '@zextras/carbonio-ui-commons';

import { convertHtmlToPlainText } from 'commons/utilities';
import { updateMessages } from 'store/emails/store';
import { MailMessage, MailMessagePart, Sensitivity } from 'types/messages';
import { Participant } from 'types/participant';

export type MessageGenerationParams = {
	id?: string;
	folderId?: string;
	from?: Participant;
	cid?: string;
	to?: Array<Participant>;
	cc?: Array<Participant>;
	receiveDate?: number;
	subject?: string;
	body?: string;
	isRead?: boolean;
	isFlagged?: boolean;
	isComplete?: boolean;
	html?: boolean;
	isDeleted?: boolean;
	isDraft?: boolean;
	isForwarded?: boolean;
	isInvite?: boolean;
	isReadReceiptRequested?: boolean;
	isReplied?: boolean;
	isScheduled?: boolean;
	isSentByMe?: boolean;
	tags?: Array<string>;
	truncated?: boolean;
	sensitivity?: Sensitivity;
	parts?: Array<MailMessagePart>;
	messageIdFromMailHeaders?: string;
	creationDateFromMailHeaders?: string;
	did?: string;
};

const loremBody =
	'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer nec odio. Praesent libero. Sed cursus ante dapibus diam.\nNam nec ante. Sed lacinia, urna non tincidunt mattis, tortor neque adipiscing diam, a cursus ipsum ante quis turpis.\nFusce nec tellus sed augue semper porta. Mauris massa.';

export const generateMessage = ({
	id = faker.number.int().toString(),
	cid = '123',
	folderId = FOLDERS.INBOX,
	receiveDate = faker.date.recent({ days: 1 }).valueOf(),
	to = [{ type: ParticipantRole.TO, address: faker.internet.email() }],
	cc = [],
	from = { type: ParticipantRole.FROM, address: faker.internet.email() },
	subject = faker.lorem.word(6),
	body = loremBody,
	isRead = false,
	isFlagged = false,
	isComplete = false,
	html = true,
	isDeleted = false,
	isDraft = false,
	isForwarded = false,
	isInvite = false,
	isReadReceiptRequested = false,
	isReplied = false,
	isScheduled = false,
	isSentByMe = false,
	tags = [],
	truncated = false,
	sensitivity = 'Private',
	messageIdFromMailHeaders = '',
	creationDateFromMailHeaders = '',
	parts,
	did = ''
}: MessageGenerationParams = {}): MailMessage => ({
	attachments: undefined,
	autoSendTime: 0,
	body: { content: body, contentType: 'text/plain', truncated },
	conversation: cid,
	date: receiveDate,
	did,
	flagged: isFlagged,
	fragment: convertHtmlToPlainText(body).substring(0, 100).trim(),
	hasAttachment: false,
	id,
	invite: undefined,
	isComplete,
	html,
	isDeleted,
	isDraft,
	isForwarded,
	isInvite,
	isReadReceiptRequested,
	isReplied,
	isScheduled,
	isSentByMe,
	parent: folderId,
	participants: [from, ...to, ...cc],
	parts: parts ?? [
		{
			name: 'TEXT',
			contentType: 'multipart/mixed',
			size: 0,
			parts: [
				{
					name: '1',
					size: 0,
					contentType: 'multipart/alternative',
					parts: [
						{
							name: '1.1',
							contentType: 'text/plain',
							size: body?.length
						},
						{
							name: '1.2',
							contentType: 'text/html',
							size: body?.length,
							content: body
						}
					]
				}
			]
		}
	],
	read: isRead,
	shr: undefined,
	size: 0,
	subject,
	tags,
	urgent: false,
	messageIsFromExternalDomain: false,
	// authenticationHeaders: {},
	sensitivity,
	messageIdFromMailHeaders,
	creationDateFromMailHeaders,
	messageIsFromDistributionList: false
});

/**
 * Populates the email store with messages and returns the generated messages.
 * The function generates messages based on provided message IDs or message generation parameters.
 * If neither is provided, it generates a default set of messages.
 *
 * It then updates the email store with the generated messages and returns them.
 */
export const populateMessagesInEmailStore = ({
	messageGeneratorParams,
	messageIds,
	messagesNumber = 1
}: {
	messageGeneratorParams?: Array<MessageGenerationParams>;
	messageIds?: Array<string>;
	messagesNumber?: number;
} = {}): Array<MailMessage> => {
	// Generate messages based on provided message IDs
	const messagesFromMessageIds = messageIds?.map((messageId) =>
		generateMessage({
			id: messageId,
			folderId: FOLDERS.INBOX,
			cid: '1'
		})
	);

	// Generate messages based on provided message generation parameters
	const messagesFromMessageGeneratorParams = messageGeneratorParams?.map((messageGeneratorParam) =>
		generateMessage({ ...messageGeneratorParam })
	);

	// Generate default messages if no message IDs or parameters are provided
	const defaultMessages = Array.from({ length: messagesNumber }).map((_, index) =>
		generateMessage({
			id: (index + 100).toString(),
			folderId: FOLDERS.INBOX,
			cid: '1'
		})
	);

	// Use the provided messages or fall back to default messages
	const generatedMessages =
		messagesFromMessageIds ?? messagesFromMessageGeneratorParams ?? defaultMessages;

	updateMessages(generatedMessages);

	return generatedMessages;
};
