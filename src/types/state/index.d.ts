/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { AppDispatch } from '../../store/redux';
import type { Conversation } from '../conversations';
import {
	AttachmentUploadProcessStatus,
	MailsEditor,
	MailsEditorV2,
	SavedAttachment,
	UnsavedAttachment
} from '../editor';
import { MailMessage } from '../messages';
import { SoapIncompleteMessage } from '../soap';

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

	updateAction: (id: MailsEditorV2['id'], action: MailsEditorV2['action']) => void;
	updateSubject: (id: MailsEditorV2['id'], subject: MailsEditorV2['subject']) => void;
	updateText: (id: MailsEditorV2['id'], text: MailsEditorV2['text']) => void;
	updateAutoSendTime: (
		id: MailsEditorV2['id'],
		autoSendTime: MailsEditorV2['autoSendTime']
	) => void;
	setDid: (id: MailsEditorV2['id'], did: MailsEditorV2['did']) => void;
	setIsRichText: (id: MailsEditorV2['id'], isRichText: MailsEditorV2['isRichText']) => void;
	setSignature: (id: MailsEditorV2['id'], signature: MailsEditorV2['signature']) => void;
	setOriginalId: (id: MailsEditorV2['id'], originalId: MailsEditorV2['originalId']) => void;
	setOriginalMessage: (
		id: MailsEditorV2['id'],
		originalMessage: MailsEditorV2['originalMessage']
	) => void;
	updateRecipients: (id: MailsEditorV2['id'], recipients: MailsEditorV2['recipients']) => void;
	updateToRecipients: (
		id: MailsEditorV2['id'],
		recipients: MailsEditorV2['recipients']['to']
	) => void;
	updateCcRecipients: (
		id: MailsEditorV2['id'],
		recipients: MailsEditorV2['recipients']['cc']
	) => void;
	updateBccRecipients: (
		id: MailsEditorV2['id'],
		recipients: MailsEditorV2['recipients']['bcc']
	) => void;
	updateIdentityId: (id: MailsEditorV2['id'], from: MailsEditorV2['identityId']) => void;
	updateIsUrgent: (id: MailsEditorV2['id'], isUrgent: MailsEditorV2['isUrgent']) => void;
	updateRequestReadReceipt: (
		id: MailsEditorV2['id'],
		requestReadReceipt: MailsEditorV2['requestReadReceipt']
	) => void;

	updateDraftSaveAllowedStatus: (
		id: MailsEditorV2['id'],
		status: MailsEditorV2['draftSaveAllowedStatus']
	) => void;

	updateDraftSaveProcessStatus: (
		id: MailsEditorV2['id'],
		status: MailsEditorV2['draftSaveProcessStatus']
	) => void;

	updateSendAllowedStatus: (
		id: MailsEditorV2['id'],
		status: MailsEditorV2['sendAllowedStatus']
	) => void;

	updateSendProcessStatus: (
		id: MailsEditorV2['id'],
		status: MailsEditorV2['sendProcessStatus']
	) => void;

	setSavedAttachments: (id: MailsEditorV2['id'], attachment: Array<SavedAttachment>) => void;
	removeSavedAttachment: (id: MailsEditorV2['id'], partName: string) => void;
	setUnsavedAttachments: (id: MailsEditorV2['id'], attachments: Array<UnsavedAttachment>) => void;
	addUnsavedAttachment: (id: MailsEditorV2['id'], attachment: UnsavedAttachment) => void;
	setAttachmentUploadStatus: (
		id: MailsEditorV2['id'],
		uploadId: string,
		status: AttachmentUploadProcessStatus
	) => void;
	setAttachmentUploadCompleted: (id: MailsEditorV2['id'], uploadId: string, aid: string) => void;
	removeUnsavedAttachment: (id: MailsEditorV2['id'], uploadId: string) => void;
	clearAttachments: (id: MailsEditorV2['id']) => void;

	// updateAttachmentFiles: (editorId, res: SaveDraftResponse) => void;
	// addAttachment: (id: MailsEditorV2['id'], attachment: MailAttachmentParts) => void;
	// updateAttachments: (id: MailsEditorV2['id'], attachments: MailsEditorV2['attachments']) => void;
	// addAttachmentFiles: (id: MailsEditorV2['id'], files: MailsEditorV2['attachmentFiles']) => void;
	// addInlineAttachment: (
	// 	id: MailsEditorV2['id'],
	// 	inlineAttachment: MailsEditorV2['inlineAttachments'][0]
	// ) => void;
	// removeInlineAttachment: (
	// 	id: MailsEditorV2['id'],
	// 	inlineAttachment: MailsEditorV2['inlineAttachments'][0]
	// ) => void;

	clearEditors: () => void;
	clearSubject: (id: MailsEditorV2['id']) => void;
	clearAutoSendTime: (id: MailsEditorV2['id']) => void;
	clearText: (id: MailsEditorV2['id']) => void;
	clearInlineAttachments: (id: MailsEditorV2['id']) => void;

	setMessagesStoreDispatch: (id: MailsEditorV2['id'], dispatch: AppDispatch) => void;

	// updateUploadProgress: (
	// 	id: MailsEditorV2['id'],
	// 	percentCompleted: number,
	// 	fileUploadingId: string
	// ) => void;
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
	messages?: Record<string, Partial<MailMessage> & Pick<MailMessage, 'id'>>;
	more: boolean;
	offset: number;
	sortBy: 'dateDesc' | 'dateAsc';
	query: string;
	status: string;
	parent?: string;
	tagName?: string;
	error?: ErrorType;
};

export type MailsEditorMap = Record<string, MailsEditor>;

export type MailsEditorMapV2 = Record<string, MailsEditorV2>;

export type MsgMap = Record<string, Partial<MailMessage> & Pick<MailMessage, 'id'>>;

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
