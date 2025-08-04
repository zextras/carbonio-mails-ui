/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { type MailVerificationHeader } from 'types/soap/soap';
import { type SoapMailParticipant } from 'types/soap/soap-mail-participant';

type MailHeaderAttrs = {
	[K in MailVerificationHeader]: K extends 'Authentication-Results' ? string | string[] : string;
};

export type SoapIncompleteMessage = {
	readonly id: string;
	cid: string; // Conversation id
	mid?: string; // Message id
	l: string; // Folder id
	s: number; // Size
	d: number; // Date
	sd?: number; // Send date
	rev?: number; // Revision
	// Flags. (u)nread, (f)lagged, has (a)ttachment, (r)eplied, (s)ent by me,
	// for(w)arded, calendar in(v)ite, (d)raft, IMAP-\Deleted (x), (n)otification sent,
	// urgent (!), low-priority (?), priority (+)
	f?: string; // Flags
	origid?: string; // Original message id (for drafts)
	tn?: string; // TagNames
	t?: string; // TagIds
	rt?: 'r' | 'w'; // ReplyType: r = replied, f = forwarded
	su?: string; // Subject
	fr?: string; // Fragment
	e?: Array<SoapMailParticipant>; // Contacts
	mp?: Array<SoapMailMessagePart>; // Parts
	autoSendTime?: number; // Scheduled time
	inv?: Array<any>; // Invite
	shr?: Array<any>; // Shared
	signature?: Array<MessageSignature>; // Signature
	_attrs?: Partial<MailHeaderAttrs>; // MailHeader attrs
};

export type MessageSignature = {
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

export type SoapMailMessage = SoapIncompleteMessage & {
	/** Contacts */ e: Array<SoapMailParticipant>;
	/** Subject */ su: string;
	/** Fragment */ fr: string;
	/** Parts */ mp: Array<SoapMailMessagePart>;
};

export type SoapMailMessagePart = {
	part: string;
	/**	Content Type  */ ct: 'multipart/alternative' | string;
	/**	Size  */ s?: number;
	/**	Content id (for inline images)  */ ci?: string;
	/** Content disposition */ cd?: 'inline' | 'attachment';
	/**	Parts  */ mp?: Array<SoapMailMessagePart>;
	/**	Set if is the body of the message  */ body?: true;
	filename?: string;
	// FIXME see IRIS-4029 Based on the compose settings the content could be a string or an object of type { _content: string }
	content?: string;
	truncated?: boolean;
};
