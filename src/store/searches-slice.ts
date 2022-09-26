/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
/* eslint-disable @typescript-eslint/explicit-function-return-type */

import { FOLDERS } from '@zextras/carbonio-shell-ui';
import { createSlice } from '@reduxjs/toolkit';
import produce from 'immer';
import { includes, map } from 'lodash';
import {
	ConvActionParameters,
	FetchConversationsReturn,
	SearchesStateType,
	StateType
} from '../types';
import { msgAction, search } from './actions';

import {
	handleAddMessagesInConversationReducer,
	handleCreatedConversationsReducer,
	handleDeletedConversationsReducer,
	handleDeletedMessagesInConversationReducer,
	handleDeletedMessagesReducer,
	handleModifiedConversationsReducer,
	handleModifiedMessagesInConversationReducer,
	handleCreatedMessagesInConversationsReducer
} from './search-slice-reducers';

const fetchSearchesPending = (state: SearchesStateType): void => {
	state.status = 'pending';
	state.conversations = [];
	state.messages = [];
};

const fetchSearchesRejected = (state: SearchesStateType): void => {
	state.status = 'error';
	state.conversations = [];
	state.messages = [];
};

const fetchSearchesFulfilled = (
	state: SearchesStateType,
	{ payload, meta }: { payload: FetchConversationsReturn | undefined; meta: any }
): void => {
	if (meta.arg.query) {
		state.status = meta.requestStatus;
		state.conversations = payload?.conversations ?? [];
		state.messages = payload?.messages ?? [];
		state.more = payload?.hasMore === true;
		state.offset = (meta?.arg.offset ?? 0) + 100;
		state.sortBy = meta?.arg.sortBy ?? 'dateDesc';
	}
};

const msgActionFulfilled = (
	state: SearchesStateType,
	{ meta }: { meta: { arg: ConvActionParameters; requestId: string; requestStatus: string } }
): void => {
	if (meta.arg.ids) {
		// state.conversations = state.conversations
		// 	? map(state.conversations, (conv) => ({
		// 			...conv,
		// 			messages: map(conv.messages, (msg) => {
		// 				if (includes(meta.arg.ids, msg.id)) {
		// 					return { ...msg, parent: FOLDERS.TRASH };
		// 				}
		// 				return msg;
		// 			})
		// 	  }))
		// 	: [];
		// state.messages = state.messages
		// 	? map(state.messages, (msg) => {
		// 			if (includes(meta.arg.ids, msg.id)) {
		// 				return { ...msg, parent: FOLDERS.TRASH };
		// 			}
		// 			return msg;
		// 	  })
		// 	: [];
	}
};

export const searchesSlice = createSlice({
	name: 'searches',
	initialState: {
		conversations: {},
		messages: {},
		more: false,
		offset: 0,
		sortBy: 'dateDesc',
		query: '',
		status: 'empty',
		loadingMessage: '',
		parent: '',
		reload: true
	} as unknown as SearchesStateType,
	reducers: {
		handleNotifyCreatedSearchConversations: produce(handleCreatedConversationsReducer),
		handleNotifyModifiedSearchConversations: produce(handleModifiedConversationsReducer),
		handleNotifyDeletedSearchConversations: produce(handleDeletedConversationsReducer),
		handleCreatedMessagesInSearchConversation: produce(handleCreatedMessagesInConversationsReducer),
		handleAddMessagesInSearchConversation: produce(handleAddMessagesInConversationReducer),
		handleDeletedMessagesInSearchConversation: produce(handleDeletedMessagesInConversationReducer),
		handleModifiedMessagesInSearchConversation: produce(
			handleModifiedMessagesInConversationReducer
		),
		handleDeletedSearchMessages: produce(handleDeletedMessagesReducer)
	},
	extraReducers: (builder) => {
		builder.addCase(search.pending, produce(fetchSearchesPending));
		builder.addCase(search.fulfilled, produce(fetchSearchesFulfilled));
		builder.addCase(search.rejected, produce(fetchSearchesRejected));
		builder.addCase(msgAction.fulfilled, produce(msgActionFulfilled));
	}
});

export const {
	handleCreatedMessagesInSearchConversation,
	handleAddMessagesInSearchConversation,
	handleModifiedMessagesInSearchConversation,
	handleDeletedMessagesInSearchConversation,
	handleNotifyCreatedSearchConversations,
	handleNotifyModifiedSearchConversations,
	handleNotifyDeletedSearchConversations,
	handleDeletedSearchMessages
} = searchesSlice.actions;
export const searchesSliceReducer = searchesSlice.reducer;
export const selectSearches = ({ searches }: StateType): SearchesStateType => searches;
export const selectSearchesStatus = ({ searches }: StateType): string => searches.status;
