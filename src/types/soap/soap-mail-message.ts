/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { MessageSchema } from '../messages';

export type SoapIncompleteMessage = {
	readonly id: MessageSchema['conversationId'];
	cid: MessageSchema['conversationId']; // Conversation id
	mid?: MessageSchema['messageId']; // Message id
	l: MessageSchema['parent']; // Folder id
	s: MessageSchema['size']; // Size
	d: MessageSchema['date']; // Date
	sd?: MessageSchema['sendDate']; // Send date
	rev?: MessageSchema['revision']; // Revision
	// Flags. (u)nread, (f)lagged, has (a)ttachment, (r)eplied, (s)ent by me,
	// for(w)arded, calendar in(v)ite, (d)raft, IMAP-\Deleted (x), (n)otification sent,
	// urgent (!), low-priority (?), priority (+)
	f?: MessageSchema['flags']; // Flags
	origid?: MessageSchema['originalMessageId']; // Original message id (for drafts)
	tn?: MessageSchema['tagNames']; // TagNames
	t?: MessageSchema['tagIds']; // TagIds
	rt?: MessageSchema['replyType']; // ReplyType: r = replied, f = forwarded
	su?: MessageSchema['subject']; // Subject
	fr?: MessageSchema['fragment']; // Fragment
	e?: MessageSchema['participants']; // Contacts
	mp?: MessageSchema['parts']; // Parts
	autoSendTime?: MessageSchema['autoSendTime']; // Scheduled time
	inv?: MessageSchema['invite']; // Invite
	shr?: MessageSchema['shared']; // Shared
	signature?: MessageSchema['signature']; // Signature
	_attrs?: MessageSchema['headers']; // MailHeader attrs
};

export type SoapMailMessage = SoapIncompleteMessage & {
	/** Contacts */ e: MessageSchema['participants'];
	/** Subject */ su: MessageSchema['subject'];
	/** Fragment */ fr: MessageSchema['fragment'];
	/** Parts */ mp: MessageSchema['parts'];
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
