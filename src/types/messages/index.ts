/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Participant } from '../participant';
import { SENSITIVITY_VALUES } from 'constants/index';
import type { MailsEditorV2 } from 'types/editor/index.d';
import type { PrefsType } from 'types/settings';
import {
	type MailVerificationHeader,
	type MessageSignature,
	type SaveDraftResponse,
	type SoapMailMessagePart,
	type SoapMailParticipant
} from 'types/soap/index.d';

type MailHeaderAttrs = {
	[K in MailVerificationHeader]: K extends 'Authentication-Results' ? string | string[] : string;
};

export type MailAuthenticationHeader = { value: string; pass: boolean };

export type MailAuthenticationHeaders = {
	dkim?: MailAuthenticationHeader;
	spf?: MailAuthenticationHeader;
	dmarc?: MailAuthenticationHeader;
};

/**
 * Central catalog of all possible message properties.
 *
 * ⚠️ This type is NOT meant to be used directly as a runtime message shape.
 * It acts as a single source of truth for property types.
 *
 * All concrete message types (e.g. SearchMessage, FullMessage, DraftMessage)
 * must be derived from this schema
 *
 * If a property type changes, it should be updated here
 * so all derived types automatically stay in sync.
 *
 */
export type MessageSchema = {
	readonly id: string;
	conversationId: string;
	messageId: string;
	parent: string;
	size: number;
	date: number;
	sendDate: number;
	revision: number;
	flags: string;
	originalMessageId: string;
	tagNames: string;
	tagIds: string;
	replyType: 'r' | 'w';
	subject: string;
	fragment: string;
	participants: Array<SoapMailParticipant>;
	parts: Array<SoapMailMessagePart>;
	autoSendTime: number;
	invite: Array<any>;
	shared: Array<any>;
	signature: Array<MessageSignature>;
	headers: Partial<MailHeaderAttrs>;
};

/**
 * Central catalog of all possible message computed properties.
 * Here are collected all the properties manipulated and normalized by the frontend.
 * If a new property is manipulated and its type or key change, it should be added here.
 */
export type MessageComputedSchema = {
	read: boolean;
	hasAttachment: boolean;
	flagged: boolean;
	urgent: boolean;
	isDeleted: boolean;
	isSentByMe: boolean;
	isForwarded: boolean;
	isInvite: boolean;
	isDraft: boolean;
	isScheduled: boolean;
	attachments: Array<AttachmentPart>;
	tags: Array<string>;
	parts: Array<MailMessagePart>;
	participants: Array<Participant>;
	body: BodyPart;
	isComplete: boolean;
	isReplied: boolean;
	isReadReceiptRequested?: boolean;
	isEncrypted: boolean;
	messageIsFromExternalDomain?: boolean;
	sensitivity: Sensitivity;
	messageIdFromMailHeaders: string;
	creationDateFromMailHeaders: string;
	messageIsFromDistributionList: boolean;
};

export type MailHeaders = {
	signature?: MessageSchema['signature'];
	messageIsFromExternalDomain?: MessageComputedSchema['messageIsFromExternalDomain'];
	// authenticationHeaders: MailAuthenticationHeaders;
	sensitivity?: MessageComputedSchema['sensitivity'];
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
	parts: MessageComputedSchema['parts'];
	body: MessageComputedSchema['body'];
	parent: MessageSchema['parent'];
	isReadReceiptRequested?: MessageComputedSchema['isReadReceiptRequested'];
};

export type BodyPart = { contentType: string; content: string; truncated: boolean };
/**
 * Parameters' type for the SendMsgRequest API command
 */
export type SendMsgParameters = {
	editor: MailsEditorV2;
	msg?: MailMessage;
	message?: MailMessage;
	prefs?: PrefsType;
};

export type SendMsgResult = {
	response:
		| SaveDraftResponse
		| (SaveDraftResponse['Fault'] & {
				error: true;
		  });
};

export type Sensitivity = (typeof SENSITIVITY_VALUES)[number];
