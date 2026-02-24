/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { AttachmentPart, BodyPart, MailMessagePart, Sensitivity } from './messages';
import { Participant } from './participant';
import {
	type MailVerificationHeader,
	MessageSignature,
	SoapMailMessagePart,
	SoapMailParticipant
} from './soap';

type MailHeaderAttrs = {
	[K in MailVerificationHeader]: K extends 'Authentication-Results' ? string | string[] : string;
};

/**
 * Central catalog of all possible message properties.
 *
 * ⚠️ This type is NOT meant to be used directly as a runtime message shape.
 * It acts as a single source of truth for property types.
 *
 * All concrete message types (e.g. SearchMessage, FullMessage, DraftMessage)
 * must be derived from this schema using utility types like:
 * - ProjectWithOptional
 * - RenameKeys
 *
 * If a property type changes, it should be updated here
 * so all derived types automatically stay in sync.
 *
 */
type MessageSchema = {
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
 * If a new property is manipulated, it should be updated here.
 */
type MessageComputedSchema = {
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

/**
 * Map MessageSchema keys to Soap Response
 */
type SoapMessageKeys = {
	conversationId: 'cid';
	messageId: 'mid';
	parent: 'l';
	size: 's';
	date: 'd';
	sendDate: 'sd';
	revision: 'rev';
	flags: 'f';
	originalMessageId: 'origid';
	tagNames: 'tn';
	tagIds: 't';
	replyType: 'rt';
	subject: 'su';
	fragment: 'fr';
	participants: 'e';
	parts: 'mp';
	invite: 'inv';
	shared: 'shr';
	headers: '_attrs';
};

/**
 * Map MessageSchema keys to frontend normalization
 */
type MessageKeys = {
	conversationId: 'conversation';
	originalMessageId: 'originalId';
	shared: 'shr';
};

/**
 * Expand a type to materialize intersections for better hover/debug in IDE.
 */
type Expand<T> = { [K in keyof T]: T[K] };

/**
 * Pick a subset of keys from T, making some of them optional.
 *
 * @template T - Base type
 * @template Keys - Keys to pick from T (default = all keys)
 * @template OptionalKeys - Keys from Keys to make optional (default = none)
 */
type ProjectWithOptional<
	T,
	Keys extends keyof T = keyof T,
	OptionalKeys extends Keys = never
> = Expand<Pick<T, Exclude<Keys, OptionalKeys>> & Partial<Pick<T, OptionalKeys>>>;

/**
 * Rename some keys of a type T according to RenameMap.
 *
 * @template T - Base type
 * @template RenameMap - mapping from old keys to new keys
 */
type RenameKeys<T, RenameMap extends Partial<Record<keyof T, string>>> = Expand<{
	[K in keyof T as K extends keyof RenameMap ? RenameMap[K] & (string | number | symbol) : K]: T[K];
}>;

type SoapMailMessage = RenameKeys<MessageSchema, SoapMessageKeys>;
type SoapMailMessageOptionalKeys =
	| 'mid'
	| 'sd'
	| 'rev'
	| 'f'
	| 'autoSendTime'
	| 'origid'
	| 'tn'
	| 't'
	| 'signature'
	| 'rt'
	| 'inv'
	| 'shr'
	| '_attrs';

export type SoapMailMessageV2 = ProjectWithOptional<
	SoapMailMessage,
	keyof SoapMailMessage,
	SoapMailMessageOptionalKeys
>;

type MailMessageProjectionKeys =
	| 'id'
	| 'parent'
	| 'conversationId'
	| 'size'
	| 'autoSendTime'
	| 'originalMessageId'
	| 'replyType'
	| 'date'
	| 'subject'
	| 'fragment'
	| 'invite'
	| 'shared'
	| 'signature';

type MailMessageOptionalKeys =
	| 'autoSendTime'
	| 'originalMessageId'
	| 'replyType'
	| 'fragment'
	| 'invite'
	| 'shared'
	| 'signature';

type MailMessageComputedOptionalKeys =
	| 'hasAttachment'
	| 'flagged'
	| 'sensitivity'
	| 'participants'
	| 'urgent'
	| 'isDeleted'
	| 'isSentByMe'
	| 'isForwarded'
	| 'isInvite'
	| 'isDraft'
	| 'attachments'
	| 'isReplied'
	| 'isEncrypted'
	| 'messageIdFromMailHeaders'
	| 'creationDateFromMailHeaders'
	| 'messageIsFromDistributionList';

/**
 * Mail Message types
 */
type MailMessageProjection = ProjectWithOptional<
	MessageSchema,
	MailMessageProjectionKeys,
	MailMessageOptionalKeys
>;

type MailMessageComputedProjection = ProjectWithOptional<
	MessageComputedSchema,
	keyof MessageComputedSchema,
	MailMessageComputedOptionalKeys
>;

type MailMessage = RenameKeys<MailMessageProjection, MessageKeys>;

export type MailMessageV2 = MailMessage & MailMessageComputedProjection;
