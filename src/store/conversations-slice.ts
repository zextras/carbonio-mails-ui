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
import type {
	ConversationsFolderStatus,
	ConversationsStateType,
	MailsStateType,
	FetchConversationsReturn,
	ConvMessage,
	ConvActionParameters,
	ConvActionResult,
	Conversation
} from '../types';

function fetchConversationsPending(state: ConversationsStateType): void {
	state.status = 'pending';
}

function fetchConversationsFulfilled(
	state: ConversationsStateType,
	{ payload, meta }: { payload: FetchConversationsReturn | undefined; meta: any }
): void {
	if (payload?.types === 'conversation' && payload?.conversations) {
		const newConversationsState =
			payload.offset && payload.offset > 0
				? { ...state.conversations, ...payload.conversations }
				: { ...payload.conversations };
		state.conversations = newConversationsState;
		state.searchedInFolder = {
			...state.searchedInFolder,
			[meta.arg.folderId]: 'complete'
		};
		state.expandedStatus = {};
	}
	state.status = payload?.hasMore ? 'hasMore' : 'complete';
}

function fetchConversationsRejected(state: ConversationsStateType, { meta }: { meta: any }): void {
	state.status = 'error';
	state.searchedInFolder = {
		...state.searchedInFolder,
		[meta.arg.folderId]: 'incomplete'
	};
}

function searchConvFulfilled(state: ConversationsStateType, { payload, meta }: any): void {
	state.expandedStatus[meta.arg.conversationId] = 'complete';
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
	state.expandedStatus[meta.arg.conversationId] = 'pending';
}

function searchConvRejected(state: ConversationsStateType, { meta }: any): void {
	state.expandedStatus[meta.arg.conversationId] = 'error';
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
		state.expandedStatus[conv.id] = 'complete';
	} else if (conv?.id && !state.conversations?.[conv.id]) {
		state.conversations[conv.id] = conv;
		state.expandedStatus[conv.id] = 'complete';
	}
}

function getConvPending(state: ConversationsStateType, { meta }: any): void {
	state.expandedStatus[meta.arg.conversationId] = 'pending';
}

function getConvRejected(state: ConversationsStateType, { meta }: any): void {
	state.expandedStatus[meta.arg.conversationId] = 'error';
}

export const getConversationsSliceInitialState = (): ConversationsStateType =>
	({
		currentFolder: FOLDERS.INBOX,
		conversations: {},
		expandedStatus: {},
		searchedInFolder: {},
		status: 'empty'
	} as ConversationsStateType);

export const conversationsSlice = createSlice({
	name: 'conversations',
	initialState: getConversationsSliceInitialState(),
	reducers: {
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

export function selectCurrentFolderExpandedStatus({
	conversations
}: MailsStateType): Record<string, string> {
	return conversations.expandedStatus;
}

export function selectConversationExpandedStatus(
	{ conversations }: MailsStateType,
	id: string
): 'pending' | 'error' | 'complete' | undefined {
	return conversations?.expandedStatus?.[id];
}

export function selectCurrentFolder({ conversations }: MailsStateType): string {
	return conversations?.currentFolder;
}

export function selectConversationStatus(state: MailsStateType): ConversationsFolderStatus {
	return state.conversations.status;
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

export function selectFolderSearchStatus(
	{ conversations }: MailsStateType,
	folderId: string
): string | undefined {
	return conversations?.searchedInFolder?.[folderId] ?? undefined;
}
