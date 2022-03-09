/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { MailsEditor } from './mails-editor';
import { MailMessage } from './mail-message';
import { Conversation } from './conversation';
import { Folder } from './folder';

export type StateType = {
	status: string;
	folders: FoldersStateType;
	editors: EditorsStateType;
	conversations: ConversationsStateType;
	sync: SyncStateType;
	messages: MsgStateType;
};

export type FoldersSlice = {
	status: string;
	folders: FoldersStateType[];
};

export type SyncStateType = {
	status: string;
	intervalId: number;
	token?: string;
};

export interface EditorsStateType {
	status: string;
	editors: MailsEditorMap;
}

export type FoldersStateType = {
	status: string;
	folders: MailsFolderMap;
};

export type MsgStateType = {
	searchedInFolder: Record<string, string>;
	messages: MsgMap;
	status: Record<string, Status>;
};

export type ConversationsStateType = {
	currentFolder: string;
	searchedInFolder: Record<string, string>;
	conversations: Record<string, Conversation>;
	expandedStatus: Record<string, Status>;
	status: ConversationsFolderStatus;
};

export type MailsFolderMap = Record<string, Folder>;

export type MailsEditorMap = Record<string, MailsEditor>;

export type MsgMap = Record<string, Partial<MailMessage>>;

export type ConversationsFolderStatus =
	| 'empty'
	| 'pending'
	| 'complete'
	| 'hasMore'
	| 'hasChange'
	| 'error';
export type Status = 'pending' | 'error' | 'complete';
