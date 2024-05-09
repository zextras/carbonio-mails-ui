/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
/* eslint-disable @typescript-eslint/explicit-function-return-type */

import { createSlice } from '@reduxjs/toolkit';
import { FOLDERS } from '@zextras/carbonio-shell-ui';
import produce from 'immer';
import { forEach } from 'lodash';
import { CONVACTIONS } from '../commons/utilities';
import type {
	ConvActionParameters,
	FetchConversationsReturn,
	SearchesStateType,
	MailsStateType
} from '../types';
import { msgAction, search } from './actions';
import {
	handleAddMessagesInConversationReducer,
	handleCreatedConversationsReducer,
	handleCreatedMessagesInConversationsReducer,
	handleDeletedConversationsReducer,
	handleDeletedMessagesInConversationReducer,
	handleDeletedMessagesReducer,
	handleModifiedConversationsReducer,
	handleModifiedMessagesInConversationReducer
} from './search-slice-reducers';
import { extractIds, isItemInSearches } from './utils';
import { LIST_LIMIT } from '../constants';
import { searchDeletedMessages } from './actions/searchInBackup';
import { SearchBackupDeletedMessagesResponse } from '../api/search-backup-deleted-messages';

export const getSearchSliceInitialiState = (): SearchesStateType =>
	({
		searchResults: undefined,
		searchResultsIds: [],
		conversations: {},
		messages: {},
		more: false,
		offset: 0,
		limit: LIST_LIMIT.INITIAL_LIMIT,
		sortBy: 'dateDesc',
		query: '',
		status: 'empty',
		loadingMessage: '',
		parent: '',
		error: undefined
	}) as SearchesStateType;

const resetResultReducer = (state: SearchesStateType): SearchesStateType =>
	getSearchSliceInitialiState();

const fetchSearchesPending = (state: SearchesStateType): void => {
	state.status = 'pending';
};

const fetchSearchesFulfilled = (
	state: SearchesStateType,
	{ payload, meta }: { payload: FetchConversationsReturn | undefined; meta: any }
): void => {
	if (meta.arg.query) {
		state.status = meta.requestStatus;
		if (state.query === meta.arg.query) {
			state.messages = { ...state.messages, ...payload?.messages };
			state.conversations = { ...state.conversations, ...payload?.conversations };
			state.searchResultsIds.concat(extractIds(payload) ?? []);
		} else {
			state.conversations = payload?.conversations ?? {};
			state.messages = payload?.messages ?? {};
			state.searchResultsIds = extractIds(payload) ?? [];
		}
		state.more = payload?.hasMore === true;
		state.offset = meta?.arg.offset ?? 0;
		state.sortBy = meta?.arg.sortBy ?? 'dateDesc';
		state.error = undefined;
		state.query = meta.arg.query;
	}
};

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const fetchSearchesRejected = (state: SearchesStateType, { payload }): void => {
	state.status = 'error';
	state.conversations = {};
	state.messages = {};
	state.error = {
		code: payload?.Detail?.Error?.Code ?? 'generic error'
	};
};

const msgActionFulfilled = (
	state: SearchesStateType,
	{ meta }: { meta: { arg: ConvActionParameters; requestId: string; requestStatus: string } }
): void => {
	const itemIsInSearches = isItemInSearches({
		ids: meta.arg.ids,
		searchResultsIds: state.searchResultsIds
	});

	if (!itemIsInSearches) {
		return;
	}
	const { ids, operation } = meta.arg;
	state.error = undefined;
	forEach(ids, (id) => {
		const message = state?.messages?.[id];
		const { conversations } = state;

		if (operation.includes(CONVACTIONS.FLAG)) {
			message.flagged = !operation.startsWith('!');
			if (conversations) conversations[id].flagged = !operation.startsWith('!');
		}

		if (operation.includes(CONVACTIONS.MARK_READ)) {
			message.read = !operation.startsWith('!');
			if (conversations) conversations[id].read = !operation.startsWith('!');
		}

		if (operation === CONVACTIONS.TRASH) {
			message.parent = FOLDERS.TRASH;
		}

		if (operation === CONVACTIONS.DELETE) {
			delete message[id];
		}

		if (operation === CONVACTIONS.MOVE) {
			message.parent = meta.arg.parent;
		}

		if (operation === CONVACTIONS.MARK_SPAM) {
			message.parent = FOLDERS.SPAM;
		}

		if (operation === CONVACTIONS.MARK_NOT_SPAM) {
			message.parent = FOLDERS.INBOX;
		}
	});
};

export const searchesSlice = createSlice({
	name: 'searches',
	initialState: getSearchSliceInitialiState(),
	reducers: {
		resetSearchResults: resetResultReducer,
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
export const selectSearches = ({ searches }: MailsStateType): SearchesStateType => searches;
export const { resetSearchResults } = searchesSlice.actions;
export const selectSearchesStatus = ({ searches }: MailsStateType): string => searches.status;
