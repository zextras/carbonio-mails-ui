/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { MailsEditorV2 } from '../editor';
import { Participant } from '../participant';
import { SaveDraftResponse } from '../soap';

export type IncompleteMessage = {
	id: string;
	did?: string;
	parent: string;
	conversation: string;
	read: boolean | string;
	size: number;
	hasAttachment: boolean;
	flagged: boolean;
	urgent: boolean;
	isDeleted: boolean;
	isSentByMe: boolean;
	isForwarded: boolean;
	isInvite: boolean;
	isDraft: boolean;
	isScheduled: boolean;
	autoSendTime?: number;
	attachments?: Array<AttachmentPart>;
	participants?: Array<Participant>;
	date: number;
	subject: string;
	fragment?: string;
	tags: string[];
	parts: Array<MailMessagePart>;
	body: {
		contentType: string;
		content: string;
	};
	invite?: any;
	shr?: any;
	isComplete: boolean;
	isReplied: boolean;
	isReadReceiptRequested?: boolean;
};

export type MailMessagePart = {
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
	body: {
		contentType: string;
		content: string;
	};
	parent: string;
	isReadReceiptRequested?: boolean;
};

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
