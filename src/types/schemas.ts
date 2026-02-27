/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ParticipantRoleType } from '@zextras/carbonio-ui-commons';

import { MAIL_VERIFICATION_HEADERS, SENSITIVITY_VALUES } from '../constants';
import { SoapMailMessage } from './soap';

type MailHeaderAttrs = {
	[K in MailVerificationHeader]: K extends 'Authentication-Results' ? string | string[] : string;
};

type MessageSignature = {
	email?: string;
	issuer?: string;
	message: string;
	messageCode: string;
	notBefore?: number;
	notAfter?: number;
	type?: string;
	trusted?: boolean;
	valid: boolean;
};

type MailVerificationHeader =
	(typeof MAIL_VERIFICATION_HEADERS)[keyof typeof MAIL_VERIFICATION_HEADERS];

type SoapEmailParticipantRole = 'f' | 't' | 'c' | 'b' | 'r' | 's' | 'n' | 'rf';

type Sensitivity = (typeof SENSITIVITY_VALUES)[number];

type SoapMailParticipant = {
	/**
	 * The email address of the participant.
	 * This is a required field.
	 */
	a: string;

	/**
	 * The display name of the participant.
	 * This is an optional field. If not provided, the email client may display only the email address.
	 */
	d?: string;

	/**
	 * The personal name of the participant.
	 * This is a required field.
	 */
	p: string;

	/**
	 * The role of the participant in the email.
	 * Possible values are:
	 * - (f)rom: Sender of the email.
	 * - (t)o: Primary recipient of the email.
	 * - (c)c: Carbon copy recipient.
	 * - (b)cc: Blind carbon copy recipient.
	 * - (r)eply-to: Address to which replies should be sent.
	 * - (s)ender: The actual sender of the email (if different from the "from" address).
	 * - (n)otification: Read receipt notification.
	 * - (rf) resent-from: Resent from address.
	 */
	t: SoapEmailParticipantRole;

	/**
	 * Indicates whether the participant is a group (e.g., a mailing list).
	 * This is an optional field.
	 */
	isGroup?: boolean;

	/**
	 * Flags whether the authenticated user can expand group members.
	 * - 1 (true): The authenticated user has permission to expand members in this group.
	 * - 0 (false): The authenticated user does not have permission to expand group members.
	 * Note: This field is present only when {isGroup} is set to `true`.
	 */
	exp?: boolean;
};

type Participant = {
	type: ParticipantRoleType;
	address: string;
	name?: string;
	fullName?: string;
	email?: string;
	error?: boolean;
	exp?: boolean;
	isGroup?: boolean;
};

type AttachmentPart = {
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

type MailMessagePart = {
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

type MessagePartSchema = {
	part: string;
	/**	Content Type  */ ct: 'multipart/alternative' | string;
	/**	Size  */ s?: number;
	/**	Content id (for inline images)  */ ci?: string;
	/** Content disposition */ cd?: 'inline' | 'attachment';
	/**	Parts  */ mp?: Array<MessagePartSchema>;
	/**	Set if is the body of the message  */ body?: true;
	filename?: string;
	// FIXME see IRIS-4029 Based on the compose settings the content could be a string or an object of type { _content: string }
	content?: string;
	truncated?: boolean;
};

type BodyPart = { contentType: string; content: string; truncated: boolean };

type ItemSchema = {
	readonly id: string;
	flags: string;
	tagNames: string;
	tagIds: string;
	date: number;
	participants: Array<SoapMailParticipant>;
	subject: string;
	fragment: string;
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
	readonly id: ItemSchema['id'];
	conversationId: string;
	messageId: string;
	parent: string;
	size: number;
	date: number;
	sendDate: number;
	revision: number;
	flags: ItemSchema['flags'];
	originalMessageId: string;
	tagNames: ItemSchema['tagNames'];
	tagIds: ItemSchema['tagIds'];
	replyType: 'r' | 'w';
	subject: string;
	fragment: string;
	participants: Array<SoapMailParticipant>;
	parts: Array<MessagePartSchema>;
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

export type ConversationSchema = {
	readonly id: ItemSchema['id'];
	/** Number of the messages */
	n: number;
	/** Number of the unread messages */
	u: number;
	/** Flags */
	f: ItemSchema['flags'];
	/** Tag names (comma separated) */
	tn: ItemSchema['tagNames'];
	/** Tag ids (comma separated) */
	t: ItemSchema['tagIds'];
	/** Date (of the most recent message) */
	d: ItemSchema['date'];
	/** Messages */
	m: SoapMailMessage[];
	/** Email information for conversation participants */
	e: SoapMailMessage['e'];
	/** Subject */
	su: ItemSchema['subject'];
	/** Fragment */
	fr: ItemSchema['fragment'];
};
