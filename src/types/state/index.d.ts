/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { SortBy } from '../../carbonio-ui-commons/types/folder';
import { API_REQUEST_STATUS } from '../../constants';
import type { AppDispatch } from '../../store/redux';
import type { SavedAttachment, UnsavedAttachment } from '../attachments';
import type { Conversation } from '../conversations';
import { AttachmentUploadProcessStatus, MailsEditor, MailsEditorV2 } from '../editor';
import { MailMessage } from '../messages';
import { SoapIncompleteMessage } from '../soap';

export type MailsStateType = {
	conversations: ConversationsStateType;
	messages: MsgStateType;
	searches: SearchesStateType;
	backupSearches: BackupSearchesStateType;
};

export type EditorsStateTypeV2 = {
	editors: MailsEditorMapV2;
	addEditor: (id: MailsEditorV2['id'], editor: MailsEditorV2) => void;
	deleteEditor: (id: MailsEditorV2['id']) => void;

	setIdentityId: (id: MailsEditorV2['id'], from: MailsEditorV2['identityId']) => void;
	setSubject: (id: MailsEditorV2['id'], subject: MailsEditorV2['subject']) => void;
	setText: (id: MailsEditorV2['id'], text: MailsEditorV2['text']) => void;
	setAutoSendTime: (id: MailsEditorV2['id'], autoSendTime: MailsEditorV2['autoSendTime']) => void;
	setDid: (id: MailsEditorV2['id'], did: MailsEditorV2['did']) => void;
	setSize: (id: MailsEditorV2['id'], size: MailsEditorV2['size']) => void;
	setTotalSmartLinksSize: (id: MailsEditorV2['id']) => void;
	setIsRichText: (id: MailsEditorV2['id'], isRichText: MailsEditorV2['isRichText']) => void;
	setIsUrgent: (id: MailsEditorV2['id'], isUrgent: MailsEditorV2['isUrgent']) => void;
	setRequestReadReceipt: (
		id: MailsEditorV2['id'],
		requestReadReceipt: MailsEditorV2['requestReadReceipt']
	) => void;
	setOriginalId: (id: MailsEditorV2['id'], originalId: MailsEditorV2['originalId']) => void;

	setRecipients: (id: MailsEditorV2['id'], recipients: MailsEditorV2['recipients']) => void;
	setToRecipients: (id: MailsEditorV2['id'], recipients: MailsEditorV2['recipients']['to']) => void;
	setCcRecipients: (id: MailsEditorV2['id'], recipients: MailsEditorV2['recipients']['cc']) => void;
	setBccRecipients: (
		id: MailsEditorV2['id'],
		recipients: MailsEditorV2['recipients']['bcc']
	) => void;

	setDraftSaveAllowedStatus: (
		id: MailsEditorV2['id'],
		status: MailsEditorV2['draftSaveAllowedStatus']
	) => void;

	setDraftSaveProcessStatus: (
		id: MailsEditorV2['id'],
		status: MailsEditorV2['draftSaveProcessStatus']
	) => void;

	setSendAllowedStatus: (
		id: MailsEditorV2['id'],
		status: MailsEditorV2['sendAllowedStatus']
	) => void;

	setSendProcessStatus: (
		id: MailsEditorV2['id'],
		status: MailsEditorV2['sendProcessStatus']
	) => void;

	setSavedAttachments: (id: MailsEditorV2['id'], attachments: Array<SavedAttachment>) => void;
	removeSavedAttachment: (id: MailsEditorV2['id'], partName: string) => void;
	removeUnsavedAttachments: (id: MailsEditorV2['id']) => void;
	addSavedAttachment: (id: MailsEditorV2['id'], attachment: SavedAttachment) => void;
	addUnsavedAttachment: (id: MailsEditorV2['id'], attachment: UnsavedAttachment) => void;
	addUnsavedAttachments: (id: MailsEditorV2['id'], attachments: Array<UnsavedAttachment>) => void;
	setAttachmentUploadStatus: (
		id: MailsEditorV2['id'],
		uploadId: string,
		status: AttachmentUploadProcessStatus
	) => void;
	setAttachmentUploadCompleted: (id: MailsEditorV2['id'], uploadId: string, aid: string) => void;
	removeUnsavedAttachment: (id: MailsEditorV2['id'], uploadId: string) => void;
	clearStandardAttachments: (id: MailsEditorV2['id']) => void;
	setMessagesStoreDispatch: (id: MailsEditorV2['id'], dispatch: AppDispatch) => void;
	toggleSmartLink: (id: MailsEditorV2['id'], partName: string) => void;
};

export type MsgStateType = {
	searchedInFolder: Record<string, SearchedFolderStateStatus>;
	messages: MsgMap;
	searchRequestStatus: SearchRequestStatus;
};

export type ErrorType = {
	code: string;
	description?: string;
};

export type ConversationsStateType = {
	currentFolder: string;
	searchedInFolder: Record<string, SearchedFolderStateStatus>;
	conversations: Record<string, Conversation>;
	expandedStatus: Record<string, SearchRequestStatus>;
	searchRequestStatus: SearchRequestStatus;
};

export type SearchesStateType = {
	searchResults: any;
	searchResultsIds: Array<string>;
	conversations?: Record<string, Conversation>;
	messages?: Record<string, Partial<MailMessage> & Pick<MailMessage, 'id', 'parent'>>;
	more: boolean;
	offset: number;
	sortBy?: SortBy;
	query?: string;
	status: string;
	parent?: string;
	tagName?: string;
	error?: ErrorType;
};

export type MsgMapValue = Partial<MailMessage> & Pick<MailMessage, 'id', 'parent'>;

export type MailsEditorMap = Record<string, MailsEditor>;

export type MailsEditorMapV2 = Record<string, MailsEditorV2>;

export type MsgMap = Record<string, MsgMapValue>;

type SearchedFolderStateStatusKey = keyof typeof SEARCHED_FOLDER_STATE_STATUS;
export type SearchedFolderStateStatus =
	(typeof SEARCHED_FOLDER_STATE_STATUS)[SearchedFolderStateStatusKey];

type ApiRequestStatusKey = keyof typeof API_REQUEST_STATUS;
export type SearchRequestStatus = (typeof API_REQUEST_STATUS)[ApiRequestStatusKey] | null;

export type Payload = {
	payload: { m: Array<SoapIncompleteMessage>; t?: any };
};
