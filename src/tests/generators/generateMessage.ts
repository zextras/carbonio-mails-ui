/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { faker } from '@faker-js/faker';
import { FOLDERS } from '@zextras/carbonio-shell-ui';
import { ParticipantRole } from '../../carbonio-ui-commons/constants/participants';
import { MailMessage, Participant } from '../../types';

/**
 *
 * @param date
 */
const toUnixTimestamp = (date: Date): number => Math.floor(date.getTime() / 1000);

/**
 *
 */
type MessageGenerationParams = {
	id?: string;
	folderId?: string;
	from?: Participant;
	to?: Array<Participant>;
	cc?: Array<Participant>;
	sendDate?: number;
	receiveDate?: number;
	subject?: string;
	body?: string;
	isRead?: boolean;
	isComplete?: boolean;
	isDeleted?: boolean;
	isDraft?: boolean;
	isForwarded?: boolean;
	isInvite?: boolean;
	isReadReceiptRequested?: boolean;
	isReplied?: boolean;
	isScheduled?: boolean;
	isSentByMe?: boolean;
};

/**
 *
 * @param id
 * @param folder
 * @param sendDate
 * @param receiveDate
 * @param participants
 * @param subject
 * @param body
 */
const generateMessage = ({
	id = faker.datatype.number().toString(),
	folderId = FOLDERS.INBOX,
	sendDate = toUnixTimestamp(faker.date.recent(2)),
	receiveDate = toUnixTimestamp(faker.date.recent(1)),
	to = [{ type: ParticipantRole.TO, address: faker.internet.email() }],
	cc = [],
	from = { type: ParticipantRole.FROM, address: faker.internet.email() },
	subject = faker.lorem.word(6),
	body = faker.lorem.paragraph(4),
	isRead = false,
	isComplete = false,
	isDeleted = false,
	isDraft = false,
	isForwarded = false,
	isInvite = false,
	isReadReceiptRequested = false,
	isReplied = false,
	isScheduled = false,
	isSentByMe = false
}: MessageGenerationParams): MailMessage => ({
	attachments: undefined,
	autoSendTime: 0,
	body: { content: body, contentType: 'text/plain' },
	conversation: '',
	date: receiveDate,
	did: '',
	flagged: false,
	fragment: '',
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
			parts: [
				{
					name: '1',
					size: 0,
					contentType: 'multipart/alternative',
					parts: [
						{ name: '1.1', contentType: 'text/plain', size: body?.length },
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
	tags: [],
	urgent: false
});

export { MessageGenerationParams, generateMessage };
