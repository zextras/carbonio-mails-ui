/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
/* eslint-disable import/no-extraneous-dependencies */

import { createSlice } from '@reduxjs/toolkit';
import produce from 'immer';

export type DeletedMessage = {
	id: string;
	folderId: string;
	owner: string;
	creationDate: string;
	deletionDate: string;
	subject: string;
	sender: string;
	to: string;
	fragment: string;
};

import { searchDeletedMessages } from './actions/searchInBackup';
import { SearchBackupDeletedMessagesResponse } from '../api/search-backup-deleted-messages';

export type BackupSearchesStateType = {
	messages?: Record<string, DeletedMessage>;
	status: string;
};

export const getBackupSearchSliceInitialiState = (): BackupSearchesStateType => ({
	messages: {},
	status: 'empty'
});

const resetBackupSearchResultsReducer = (): void => {
	getBackupSearchSliceInitialiState();
};

const handleBackupSearchMessagesFulfilled = (
	state: BackupSearchesStateType,
	{ payload, meta }: { payload: SearchBackupDeletedMessagesResponse; meta: any }
): void => {
	state.status = meta.requestStatus;
	const messages = payload?.messages.reduce((acc, message) => {
		const { id: messageId } = message;
		return { ...acc, [messageId]: message };
	}, {});
	state.messages = messages;
};

const handleBackupSearchMessagesRejected = (
	state: BackupSearchesStateType,
	{ meta }: { meta: any }
): void => {
	state.status = meta.requestStatus;
	state.messages = {};
};

const handleBackupSearchMessagesPending = (
	state: BackupSearchesStateType,
	{ meta }: { meta: any }
): void => {
	console.log('meta ===== pending', meta);
	state.status = meta.requestStatus;
	state.messages = {};
};

export const backupSearchSlice = createSlice({
	name: 'backupSearchMessages',
	initialState: getBackupSearchSliceInitialiState(),
	reducers: {
		resetBackupSearchResults: resetBackupSearchResultsReducer
	},
	extraReducers: (builder) => {
		builder.addCase(searchDeletedMessages.fulfilled, produce(handleBackupSearchMessagesFulfilled));
		builder.addCase(searchDeletedMessages.rejected, produce(handleBackupSearchMessagesRejected));
		builder.addCase(searchDeletedMessages.pending, produce(handleBackupSearchMessagesPending));
	}
});

export const backupSearchSliceReducer = backupSearchSlice.reducer;

export const { resetBackupSearchResults } = backupSearchSlice.actions;

export const selectBackupSearchMessagesStore = (state: {
	backupSearches: BackupSearchesStateType;
}): BackupSearchesStateType => state.backupSearches;
