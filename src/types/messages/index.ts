/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { MessageComputedSchema, MessageSchema } from '../schemas';

export type MailAuthenticationHeader = { value: string; pass: boolean };

export type MailAuthenticationHeaders = {
	dkim?: MailAuthenticationHeader;
	spf?: MailAuthenticationHeader;
	dmarc?: MailAuthenticationHeader;
};

export type SoapMessageParticipant = MessageSchema['participants'][number];
export type SoapMessagePart = MessageSchema['parts'][number];
export type SoapMessageInvite = MessageSchema['invite'][number];
export type SoapMessageShared = MessageSchema['shared'][number];
export type SoapMessageSignature = MessageSchema['signature'][number];

export type MailMessageAttachment = MessageComputedSchema['attachments'][number];
export type MailMessagePart = MessageComputedSchema['parts'][number];
export type MailMessageParticipant = MessageComputedSchema['participants'][number];
export type MailMessageSignature = MessageSchema['signature'][number];
export type Sensitivity = MessageComputedSchema['sensitivity'];

export type MailHeaders = {
	signature?: MessageSchema['signature'];
	messageIsFromExternalDomain?: MessageComputedSchema['messageIsFromExternalDomain'];
	// authenticationHeaders: MailAuthenticationHeaders;
	sensitivity?: Sensitivity;
	messageIdFromMailHeaders?: MessageComputedSchema['messageIdFromMailHeaders'];
	creationDateFromMailHeaders?: MessageComputedSchema['creationDateFromMailHeaders'];
	messageIsFromDistributionList?: MessageComputedSchema['messageIsFromDistributionList'];
};

export type IncompleteMessage = MailHeaders & {
	id: MessageSchema['id'];
	did?: string;
	parent: MessageSchema['parent'];
	conversation: MessageSchema['conversationId'];
	size: MessageSchema['size'];
	autoSendTime?: MessageSchema['autoSendTime'];
	originalId?: MessageSchema['originalMessageId'];
	replyType?: MessageSchema['replyType'];
	date: MessageSchema['date'];
	subject: MessageSchema['subject'];
	fragment?: MessageSchema['fragment'];
	invite?: MessageSchema['invite'];
	shr?: MessageSchema['shared'];
	read: MessageComputedSchema['read'];
	hasAttachment?: MessageComputedSchema['hasAttachment'];
	flagged?: MessageComputedSchema['flagged'];
	urgent?: MessageComputedSchema['urgent'];
	isDeleted?: MessageComputedSchema['isDeleted'];
	isSentByMe?: MessageComputedSchema['isSentByMe'];
	isForwarded?: MessageComputedSchema['isForwarded'];
	isInvite?: MessageComputedSchema['isInvite'];
	isDraft?: MessageComputedSchema['isDraft'];
	isScheduled: MessageComputedSchema['isScheduled'];
	attachments?: MessageComputedSchema['attachments'];
	tags: MessageComputedSchema['tags'];
	parts: MessageComputedSchema['parts'];
	participants?: MessageComputedSchema['participants'];
	body: MessageComputedSchema['body'];
	isComplete: MessageComputedSchema['isComplete'];
	isReplied?: MessageComputedSchema['isReplied'];
	isReadReceiptRequested?: MessageComputedSchema['isReadReceiptRequested'];
	isEncrypted?: MessageComputedSchema['isEncrypted'];
};

export type MailMessagePartWithDisposition = MailMessagePart & {
	disposition: 'inline' | 'attachment';
};

export type MailMessage = IncompleteMessage & {
	parts: MessageComputedSchema['parts'];
	body: MessageComputedSchema['body'];
	parent: MessageSchema['parent'];
	isReadReceiptRequested?: MessageComputedSchema['isReadReceiptRequested'];
};
