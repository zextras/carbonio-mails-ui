/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import type { Conversation } from '../conversations';
import { MailsEditor, MailsEditorV2, Recipients } from '../editor';
import { AttachmentPart, MailMessage } from '../messages';

export type MailsStateType = {
	editors: EditorsStateType;
	conversations: ConversationsStateType;
	messages: MsgStateType;
	searches: SearchesStateType;
};

export type EditorsStateType = {
	status: string;
	editors: MailsEditorMap;
};

export type EditorsStateTypeV2 = {
	editors: MailsEditorMapV2;
	addEditor: (id: string, editor: MailsEditorV2) => void;
	deleteEditor: (id: string) => void;
	updateEditor: (id: string, opt: Partial<MailsEditor>) => void;
	updateSubject: (id: string, subject: string) => void;
	updateText: (id: string, text: [string, string]) => void;
	updateAutoSendTime: (id: string, autoSendTime: number | undefined) => void;
	setDid: (id: string, did: string | undefined) => void;
	setIsRichText: (id: string, isRichText: boolean) => void;
	setOriginalId: (id: string, originalId: string | undefined) => void;
	setOriginalMessage: (id: string, originalMessage: MailMessage | undefined) => void;
	updateRecipients: (id: string, recipients: Recipients) => void;
	deleteEditor: (id: string) => void;
	updateFrom: (id: string, from: Recipient) => void;
	updateIsUrgent: (id: string, isUrgent: boolean) => void;
	addAttachments: (id: string, attachments: AttachmentPart[]) => void;
	removeAttachments: (id: string, attachments: AttachmentPart[]) => void;
	addInlineAttachments: (id: string, inlineAttachments: AttachmentPart[]) => void;
	removeInlineAttachments: (id: string, inlineAttachments: AttachmentPart[]) => void;
	clearEditors: () => void;
	clearSubject: (id: string) => void;
	clearAutoSendTime: (id: string) => void;
	clearText: (id: string) => void;
	clearAttachments: (id: string) => void;
	clearInlineAttachments: (id: string) => void;
};

export type MsgStateType = {
	searchedInFolder: Record<string, string>;
	messages: MsgMap;
	status: Record<string, Status>;
};

export type ErrorType = {
	code: string;
	description?: string;
};

export type ConversationsStateType = {
	currentFolder: string;
	searchedInFolder: Record<string, string>;
	conversations: Record<string, Conversation>;
	expandedStatus: Record<string, Status>;
	status: ConversationsFolderStatus;
};

export type SearchesStateType = {
	searchResults: any;
	searchResultsIds: Array<string>;
	conversations?: Record<string, Conversation>;
	messages?: Record<string, Partial<MailMessage>>;
	more: boolean;
	offset: number;
	sortBy: 'dateDesc' | 'dateAsc';
	query: string;
	status: string;
	parent?: string;
	tagName?: string;
	error?: ErrorType;
};

export type MailsFolderMap = Record<string, FolderType>;

export type MailsEditorMap = Record<string, MailsEditor>;
export type MailsEditorMapV2 = Record<string, MailsEditorV2>;

export type MsgMap = Record<string, Partial<MailMessage>>;

export type ConversationsFolderStatus =
	| 'empty'
	| 'pending'
	| 'complete'
	| 'hasMore'
	| 'hasChange'
	| 'error';
export type Status = 'pending' | 'error' | 'complete';

export type Payload = {
	payload: { m: Array<SoapIncompleteMessage>; t?: any };
};
