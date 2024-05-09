/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
/* eslint-disable import/no-extraneous-dependencies */

import { createSlice } from '@reduxjs/toolkit';
import produce from 'immer';

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

export const backupMessagesSlice = createSlice({
	name: 'backupSearchMessages',
	initialState: getBackupSearchSliceInitialiState(),
	reducers: {
		handleBackupSearchMessages: produce(handleBackupSearchMessagesReducer)
	},
	extraReducers: (builder) => {
		// builder.addCase(searchDeletedMessages.fulfilled, produce(searchDeletedMessagesFulfilled));
	}
});

export const backupSearchMessagesReducer = backupMessagesSlice.reducers;
