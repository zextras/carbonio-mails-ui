/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { faker } from '@faker-js/faker';

import { FOLDERS } from '../../carbonio-ui-commons/constants/folders';
import { ParticipantRole } from '../../carbonio-ui-commons/constants/participants';
import { convertHtmlToPlainText } from '../../carbonio-ui-commons/utils/text/html';
import type { MailMessage, Participant } from '../../types';

/**
 *
 */
type MessageGenerationParams = {
	id?: string;
	folderId?: string;
	from?: Participant;
	to?: Array<Participant>;
	cc?: Array<Participant>;
	receiveDate?: number;
	subject?: string;
	body?: string;
	isRead?: boolean;
	isFlagged?: boolean;
	isComplete?: boolean;
	isDeleted?: boolean;
	isDraft?: boolean;
	isForwarded?: boolean;
	isInvite?: boolean;
	isReadReceiptRequested?: boolean;
	isReplied?: boolean;
	isScheduled?: boolean;
	isSentByMe?: boolean;
	tags?: Array<string>;
};

/**
 *
 * @param id
 * @param folderId
 * @param receiveDate
 * @param to
 * @param cc
 * @param from
 * @param subject
 * @param body
 * @param isRead
 * @param isFlagged
 * @param isComplete
 * @param isDeleted
 * @param isDraft
 * @param isForwarded
 * @param isInvite
 * @param isReadReceiptRequested
 * @param isReplied
 * @param isScheduled
 * @param isSentByMe
 */
const generateMessage = ({
	id = faker.number.int().toString(),
	folderId = FOLDERS.INBOX,
	receiveDate = faker.date.recent({ days: 1 }).valueOf(),
	to = [{ type: ParticipantRole.TO, address: faker.internet.email() }],
	cc = [],
	from = { type: ParticipantRole.FROM, address: faker.internet.email() },
	subject = faker.lorem.word(6),
	body = faker.lorem.paragraph(4),
	isRead = false,
	isFlagged = false,
	isComplete = false,
	isDeleted = false,
	isDraft = false,
	isForwarded = false,
	isInvite = false,
	isReadReceiptRequested = false,
	isReplied = false,
	isScheduled = false,
	isSentByMe = false,
	tags = []
}: MessageGenerationParams = {}): MailMessage => ({
	attachments: undefined,
	autoSendTime: 0,
	body: { content: body, contentType: 'text/plain', truncated: false },
	conversation: '',
	date: receiveDate,
	did: '',
	flagged: isFlagged,
	fragment: convertHtmlToPlainText(body).substring(0, 40),
	hasAttachment: false,
	id,
	invite: undefined,
	isComplete,
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
	parts: [
		{
			name: 'TEXT',
			contentType: 'multipart/mixed',
			size: 0,
			requiresSmartLinkConversion: false,
			truncated: false,
			parts: [
				{
					name: '1',
					size: 0,
					contentType: 'multipart/alternative',
					requiresSmartLinkConversion: false,
					truncated: false,
					parts: [
						{
							name: '1.1',
							contentType: 'text/plain',
							size: body?.length,
							requiresSmartLinkConversion: false,
							truncated: false
						},
						{
							name: '1.2',
							contentType: 'text/html',
							size: body?.length,
							content: body,
							requiresSmartLinkConversion: false,
							truncated: false
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
	urgent: false
});

export { MessageGenerationParams, generateMessage };
