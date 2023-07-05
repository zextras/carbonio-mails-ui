/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import produce from 'immer';
import { remove } from 'lodash';
import type { Conversation } from '../conversations';
import {
	DraftSaveEndListener,
	DraftSaveStartListener,
	MailsEditor,
	MailsEditorV2,
	Recipients
} from '../editor';
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
	addEditor: (id: MailsEditorV2['id'], editor: MailsEditorV2) => void;
	deleteEditor: (id: MailsEditorV2['id']) => void;
	updateEditor: (id: MailsEditorV2['id'], opt: Partial<MailsEditorV2>) => void;
	updateSubject: (id: MailsEditorV2['id'], subject: MailsEditorV2['subject']) => void;
	updateText: (id: MailsEditorV2['id'], text: MailsEditorV2['text']) => void;
	updateAutoSendTime: (
		id: MailsEditorV2['id'],
		autoSendTime: MailsEditorV2['autoSendTime']
	) => void;
	setDid: (id: MailsEditorV2['id'], did: MailsEditorV2['did']) => void;
	setIsRichText: (id: MailsEditorV2['id'], isRichText: MailsEditorV2['isRichText']) => void;
	setOriginalId: (id: MailsEditorV2['id'], originalId: MailsEditorV2['originalId']) => void;
	setOriginalMessage: (
		id: MailsEditorV2['id'],
		originalMessage: MailsEditorV2['originalMessage']
	) => void;
	updateRecipients: (id: MailsEditorV2['id'], recipients: MailsEditorV2['recipients']) => void;
	deleteEditor: (id: MailsEditorV2['id']) => void;
	updateFrom: (id: MailsEditorV2['id'], from: MailsEditorV2['from']) => void;
	updateIsUrgent: (id: MailsEditorV2['id'], isUrgent: MailsEditorV2['isUrgent']) => void;
	addAttachment: (id: MailsEditorV2['id'], attachment: MailsEditorV2['attachments'][0]) => void;
	updateAttachments: (id: MailsEditorV2['id'], attachments: MailsEditorV2['attachments']) => void;
	addInlineAttachment: (
		id: MailsEditorV2['id'],
		inlineAttachment: MailsEditorV2['inlineAttachments'][0]
	) => void;
	removeInlineAttachment: (
		id: MailsEditorV2['id'],
		inlineAttachment: MailsEditorV2['inlineAttachments'][0]
	) => void;
	clearEditors: () => void;
	clearSubject: (id: MailsEditorV2['id']) => void;
	clearAutoSendTime: (id: MailsEditorV2['id']) => void;
	clearText: (id: MailsEditorV2['id']) => void;
	clearAttachments: (id: MailsEditorV2['id']) => void;
	clearInlineAttachments: (id: MailsEditorV2['id']) => void;
	addDraftSaveStartListener: (id: MailsEditorV2['id'], listener: DraftSaveStartListener) => void;
	removeDraftSaveStartListener: (id: MailsEditorV2['id'], listener: DraftSaveStartListener) => void;
	addDraftSaveEndListener: (id: MailsEditorV2['id'], listener: DraftSaveEndListener) => void;
	removeDraftSaveEndListener: (id: MailsEditorV2['id'], listener: DraftSaveEndListener) => void;
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
