/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { SENSITIVITY_VALUES } from 'constants/index';
import type { Participant } from 'types/participant';
import type { MessageSignature } from 'types/soap';

export type MailAuthenticationHeader = { value: string; pass: boolean };

export type MailAuthenticationHeaders = {
	dkim?: MailAuthenticationHeader;
	spf?: MailAuthenticationHeader;
	dmarc?: MailAuthenticationHeader;
};

export type MailHeaders = {
	signature?: Array<MessageSignature>;
	messageIsFromExternalDomain?: boolean;
	// authenticationHeaders: MailAuthenticationHeaders;
	sensitivity?: Sensitivity;
	messageIdFromMailHeaders?: string;
	creationDateFromMailHeaders?: string;
	messageIsFromDistributionList?: boolean;
};

export type IncompleteMessage = MailHeaders & {
	id: string;
	did?: string;
	parent: string;
	conversation: string;
	read: boolean;
	size: number;
	hasAttachment?: boolean;
	flagged?: boolean;
	urgent?: boolean;
	isDeleted?: boolean;
	isSentByMe?: boolean;
	isForwarded?: boolean;
	isInvite?: boolean;
	isDraft?: boolean;
	isScheduled: boolean;
	autoSendTime?: number;
	originalId?: string;
	replyType?: 'r' | 'w';
	attachments?: Array<AttachmentPart>;
	participants?: Array<Participant>;
	date: number;
	subject: string;
	fragment?: string;
	tags: string[];
	parts: Array<MailMessagePart>;
	body: BodyPart;
	invite?: any;
	shr?: any;
	isComplete: boolean;
	html?: boolean;
	isReplied?: boolean;
	isReadReceiptRequested?: boolean;
	isEncrypted?: boolean;
};

export type MailMessagePart = {
	body?: boolean;
	contentType: string;
	size: number;
	content?: string;
	name: string;
	filename?: string;
	parts?: Array<MailMessagePart>;
	ci?: string;
	cd?: string;
	disposition?: 'inline' | 'attachment';
};

export type MailMessagePartWithDisposition = MailMessagePart & {
	disposition: 'inline' | 'attachment';
};

export type AttachmentPart = {
	part?: string;
	ct?: string;
	s?: number;
	size?: number;
	filename?: string;
	body?: boolean;
	contentType?: string;
	content?: string;
	name?: string;
	parts?: Array<AttachmentPart>;
	ci?: string;
	disposition?: 'inline' | 'attachment';
	cd?: 'inline' | 'attachment';
	mp?: Array<AttachmentPart>;
};

export type MailMessage = IncompleteMessage & {
	parts: Array<MailMessagePart>;
	body: BodyPart;
	parent: string;
	isReadReceiptRequested?: boolean;
};

export type BodyPart = { contentType: string; content: string; truncated: boolean };

export type Sensitivity = (typeof SENSITIVITY_VALUES)[number];
