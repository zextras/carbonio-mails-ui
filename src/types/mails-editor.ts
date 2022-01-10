/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { MailMessage } from './mail-message';
import { Participant } from './participant';
import { mailAttachment } from './soap/save-draft';

export type EditorAttachmentFiles = {
	contentType: string;
	disposition: string;
	fileName?: string;
	name: string;
	size: number;
};

export type MailsEditor = {
	id: string | undefined;
	did?: string | undefined;
	oldId?: string | undefined;
	editorId: string;
	richText: boolean;
	text: Array<string>;
	subject: string;
	original?: MailMessage;
	attach: mailAttachment;
	to: Array<Participant>;
	bcc: Array<Participant>;
	cc: Array<Participant>;
	participants?: Array<Participant> | undefined;
	from: Participant;
	sender?: Participant | any;
	urgent: boolean;
	attachmentFiles: Array<EditorAttachmentFiles>;
};
