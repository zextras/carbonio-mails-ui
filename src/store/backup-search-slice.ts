/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
/* eslint-disable import/no-extraneous-dependencies */

import { createSlice } from '@reduxjs/toolkit';
import produce from 'immer';

import { searchDeletedMessages } from './actions/searchInBackup';
import {
	DeletedMessage,
	SearchBackupDeletedMessagesResponse
} from '../api/search-backup-deleted-messages';

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

const handleBackupSearchMessagesReducer = (
	state: BackupSearchesStateType,
	{ payload, meta }: { payload: SearchBackupDeletedMessagesResponse; meta: any }
): void => {
	state.status = meta.requestStatus;
	const messages = payload?.messages.reduce((acc, message) => {
		const { messageId } = message;
		return { ...acc, [messageId]: message };
	}, {});
	state.messages = messages;
};

export const backupSearchSlice = createSlice({
	name: 'backupSearchMessages',
	initialState: getBackupSearchSliceInitialiState(),
	reducers: {
		resetBackupSearchResults: resetBackupSearchResultsReducer
	},
	extraReducers: (builder) => {
		builder.addCase(searchDeletedMessages.fulfilled, produce(handleBackupSearchMessagesReducer));
	}
});

export const backupSearchSliceReducer = backupSearchSlice.reducer;

export const { resetBackupSearchResults } = backupSearchSlice.actions;

export const selectBackupSearchMessagesStore = (state: {
	backupSearches: BackupSearchesStateType;
}): BackupSearchesStateType => state.backupSearches;
