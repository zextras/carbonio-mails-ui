/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
/* eslint-disable no-param-reassign */

/* eslint no-param-reassign: ["error", { "props": true, "ignorePropertyModificationsFor": ["state", "conversation", "message", "cache"] }] */

import { createSelector, createSlice } from '@reduxjs/toolkit';
import { FOLDERS } from '@zextras/carbonio-shell-ui';
import produce from 'immer';
import { forEach, merge, reduce } from 'lodash';

import { convAction, getConv, searchConv, search } from './actions';
import {
	handleAddMessagesInConversationReducer,
	handleCreatedConversationsReducer,
	handleCreatedMessagesInConversationsReducer,
	handleDeletedConversationsReducer,
	handleDeletedMessagesInConversationReducer,
	handleModifiedConversationsReducer,
	handleModifiedMessagesInConversationReducer
} from './sync/conversation';
import { API_REQUEST_STATUS, SEARCHED_FOLDER_STATE_STATUS } from '../constants';
import type {
	ConversationsStateType,
	MailsStateType,
	FetchConversationsReturn,
	ConvMessage,
	ConvActionParameters,
	ConvActionResult,
	Conversation,
	SearchRequestStatus
} from '../types';

const resetConversationReducer = (state: ConversationsStateType): ConversationsStateType =>
getConversationsSliceInitialState();

function fetchConversationsPending(state: ConversationsStateType, { payload, meta }: any): void {
	if (meta?.arg?.types === 'conversation') {
		state.searchRequestStatus = meta.requestStatus;
	}
}

function fetchConversationsFulfilled(
	state: ConversationsStateType,
	{ payload, meta }: { payload: FetchConversationsReturn | undefined; meta: any }
): void {
	if (payload?.types === 'conversation' && payload?.conversations) {
		state.searchRequestStatus = meta.requestStatus;
		const newConversationsState =
			payload.offset && payload.offset > 0
				? { ...state.conversations, ...payload.conversations }
				: { ...payload.conversations };
		state.conversations = newConversationsState;
		state.searchedInFolder = {
			...state.searchedInFolder,
			[meta.arg.folderId]: payload?.hasMore
				? SEARCHED_FOLDER_STATE_STATUS.hasMore
				: SEARCHED_FOLDER_STATE_STATUS.complete
		};
		state.expandedStatus = {};
	}
}

function fetchConversationsRejected(state: ConversationsStateType, { payload, meta }: any): void {
	if (payload?.types === 'conversation' && payload?.conversations) {
		state.searchRequestStatus = meta.requestStatus;
		state.searchedInFolder = {
			...state.searchedInFolder,
			[meta.arg.folderId]: SEARCHED_FOLDER_STATE_STATUS.incomplete
		};
	}
}

function searchConvFulfilled(state: ConversationsStateType, { payload, meta }: any): void {
	state.expandedStatus[meta.arg.conversationId] = meta.requestStatus;
	const conversation = state.conversations[meta.arg.conversationId];
	if (conversation) {
		conversation.messages = reduce(
			payload.messages,
			(acc, v) => [...acc, { id: v.id, parent: v.parent, date: Number(v.date) }],
			[] as Array<ConvMessage>
		);
	}
}

function searchConvPending(state: ConversationsStateType, { meta }: any): void {
	state.expandedStatus[meta.arg.conversationId] = meta.requestStatus;
}

function searchConvRejected(state: ConversationsStateType, { meta }: any): void {
	state.expandedStatus[meta.arg.conversationId] = meta.requestStatus;
}

function convActionPending(
	{ conversations }: ConversationsStateType,
	{ meta }: { meta: { arg: ConvActionParameters; requestId: string; requestStatus: string } }
): void {
	const { ids, operation } = meta.arg;

	forEach(ids, (id: string) => {
		if (conversations?.[id]) {
			if (operation.includes('flag')) {
				conversations[id].flagged = !operation.startsWith('!');
			} else if (operation.includes('read')) {
				conversations[id].read = !operation.startsWith('!');
			}
		}
	});
}

function convActionFulfilled(
	{ conversations }: ConversationsStateType,
	{
		payload
	}: {
		payload: ConvActionResult;
		meta: { arg: ConvActionParameters; requestId: string; requestStatus: string };
	}
): void {
	const { ids, operation } = payload;

	forEach(ids, (id: string) => {
		if (conversations?.[id]) {
			if (operation === 'delete') {
				delete conversations[id];
			}
		}
	});
}

function convActionRejected(
	{ conversations }: ConversationsStateType,
	{ meta }: { meta: { arg: ConvActionParameters; requestId: string; requestStatus: string } }
): void {
	const { ids, operation } = meta.arg;

	forEach(ids, (id: string) => {
		if (conversations?.[id]) {
			if (operation.includes('flag')) {
				conversations[id].flagged = operation.startsWith('!');
			} else if (operation.includes('read')) {
				conversations[id].read = operation.startsWith('!');
			}
		}
	});
}

export function setCurrentFolderReducer(
	state: ConversationsStateType,
	{ payload }: { payload: string }
): void {
	state.currentFolder = payload;
}

export function setSearchedInFolderReducer(
	state: ConversationsStateType,
	{ payload }: { payload: Record<string, string> }
): void {
	state.searchedInFolder = merge(state.searchedInFolder, payload);
}
function getConvFulfilled(state: ConversationsStateType, { payload }: any): void {
	const conv = payload.conversation;
	if (conv?.id && state.conversations?.[conv.id]) {
		state.conversations[conv.id] = merge(state.conversations[conv.id], conv);
		state.expandedStatus[conv.id] = API_REQUEST_STATUS.fulfilled;
	} else if (conv?.id && !state.conversations?.[conv.id]) {
		state.conversations[conv.id] = conv;
		state.expandedStatus[conv.id] = API_REQUEST_STATUS.fulfilled;
	}
}

function getConvPending(state: ConversationsStateType, { meta }: any): void {
	state.expandedStatus[meta.arg.conversationId] = meta.requestStatus;
}

function getConvRejected(state: ConversationsStateType, { meta }: any): void {
	state.expandedStatus[meta.arg.conversationId] = meta.requestStatus;
}

export const getConversationsSliceInitialState = (): ConversationsStateType =>
	({
		currentFolder: FOLDERS.INBOX,
		conversations: {},
		expandedStatus: {},
		searchedInFolder: {},
		searchRequestStatus: null
	}) as ConversationsStateType;

export const conversationsSlice = createSlice({
	name: 'conversations',
	initialState: getConversationsSliceInitialState(),
	reducers: {
		resetConversationSlice:resetConversationReducer,
		handleNotifyCreatedConversations: produce(handleCreatedConversationsReducer),
		handleNotifyModifiedConversations: produce(handleModifiedConversationsReducer),
		handleNotifyDeletedConversations: produce(handleDeletedConversationsReducer),
		handleCreatedMessagesInConversation: produce(handleCreatedMessagesInConversationsReducer),
		handleModifiedMessagesInConversation: produce(handleModifiedMessagesInConversationReducer),
		handleDeletedMessagesInConversation: produce(handleDeletedMessagesInConversationReducer),
		handleAddMessagesInConversation: produce(handleAddMessagesInConversationReducer),
		setCurrentFolder: produce(setCurrentFolderReducer),
		setSearchedInFolder: produce(setSearchedInFolderReducer)
	},
	extraReducers: (builder) => {
		builder.addCase(search.pending, produce(fetchConversationsPending));
		builder.addCase(search.fulfilled, produce(fetchConversationsFulfilled));
		builder.addCase(search.rejected, produce(fetchConversationsRejected));
		builder.addCase(searchConv.pending, produce(searchConvPending));
		builder.addCase(searchConv.fulfilled, produce(searchConvFulfilled));
		builder.addCase(searchConv.rejected, produce(searchConvRejected));
		builder.addCase(convAction.pending, produce(convActionPending));
		builder.addCase(convAction.rejected, produce(convActionRejected));
		builder.addCase(convAction.fulfilled, produce(convActionFulfilled));
		builder.addCase(getConv.pending, produce(getConvPending));
		builder.addCase(getConv.fulfilled, produce(getConvFulfilled));
		builder.addCase(getConv.rejected, produce(getConvRejected));
	}
});

export const {
	handleNotifyCreatedConversations,
	handleNotifyModifiedConversations,
	handleNotifyDeletedConversations,
	handleCreatedMessagesInConversation,
	handleModifiedMessagesInConversation,
	handleAddMessagesInConversation,
	handleDeletedMessagesInConversation,
	setSearchedInFolder
} = conversationsSlice.actions;
export const conversationsSliceReducer = conversationsSlice.reducer;

const selectConversationsSlice = (state: MailsStateType): MailsStateType['conversations'] =>
	state.conversations;


export const { resetConversationSlice } = conversationsSlice.actions;

export function selectCurrentFolderExpandedStatus({
	conversations
}: MailsStateType): Record<string, SearchRequestStatus> {
	return conversations.expandedStatus;
}

export function selectConversationExpandedStatus(
	{ conversations }: MailsStateType,
	id: string
): SearchRequestStatus | undefined {
	return conversations?.expandedStatus?.[id];
}

export function selectCurrentFolder({ conversations }: MailsStateType): string {
	return conversations?.currentFolder;
}

export function selectSearchedFolder({ conversations }: MailsStateType, id: string): string {
	return conversations?.searchedInFolder?.[id];
}

export const selectConversationsArray = createSelector([selectConversationsSlice], (slice) =>
	Object.values(slice.conversations ?? [])
);

export const selectConversation =
	(id: string) =>
	({ conversations }: MailsStateType): Conversation =>
		conversations?.conversations?.[id] ?? {};

export const selectFolderSearchStatus =
	(folderId: string) =>
	({ conversations }: MailsStateType): string | undefined =>
		conversations?.searchedInFolder?.[folderId];

export function selectConversationsSearchRequestStatus(
	state: MailsStateType
): MailsStateType['conversations']['searchRequestStatus'] {
	return state?.conversations?.searchRequestStatus;
}
