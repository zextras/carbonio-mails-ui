/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export type IncompleteMessage = {
	id: string;
	did?: string;
	parent: string;
	conversation: string;
	read: boolean;
	size: number;
	attachment: boolean;
	flagged: boolean;
	urgent: boolean;
	isDeleted: boolean;
	isSentByMe: boolean;
	isForwarded: boolean;
	isInvite: boolean;
	isDraft: boolean;
	isScheduled: boolean;
	autoSendTime?: number;
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
	disposition: 'inline' | 'attachment';
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

export type SendMsgParameters = {
	editorId: string;
	msg?: MailMessage;
	prefs?: PrefsType;
};
