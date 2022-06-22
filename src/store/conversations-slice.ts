/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
/* eslint-disable no-param-reassign */

/* eslint no-param-reassign: ["error", { "props": true, "ignorePropertyModificationsFor": ["state", "conversation", "message", "cache", "folder-panel"] }] */

import { createSlice } from '@reduxjs/toolkit';
import produce from 'immer';
import { find, forEach, merge, reduce } from 'lodash';
import { Conversation, ConvMessage } from '../types/conversation';
import { Folder } from '../types/folder';
import { ConversationsFolderStatus, ConversationsStateType, StateType } from '../types/state';
import {
	convAction,
	ConvActionParameters,
	ConvActionResult,
	getConv,
	searchConv,
	search,
	FetchConversationsReturn
} from './actions';
import {
	handleAddMessagesInConversationReducer,
	handleCreatedConversationsReducer,
	handleCreatedMessagesInConversationsReducer,
	handleDeletedConversationsReducer,
	handleDeletedMessagesInConversationReducer,
	handleModifiedConversationsReducer,
	handleModifiedMessagesInConversationReducer
} from './sync/conversation';

function fetchConversationsPending(state: ConversationsStateType): void {
	state.status = 'pending';
}

function fetchConversationsFulfilled(
	state: ConversationsStateType,
	{ payload, meta }: { payload: FetchConversationsReturn | undefined; meta: any }
): void {
	if (payload?.types === 'conversation' && payload?.conversations) {
		state.conversations = { ...state.conversations, ...payload.conversations };
		state.searchedInFolder = {
			...state.searchedInFolder,
			[meta.arg.folderId]: 'complete'
		};
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
			conversation.messages,
			(acc, v) => {
				const msg = find(payload.messages, ['id', v.id]);
				return msg ? [...acc, { id: v.id, parent: v.parent, date: Number(v.date) }] : [...acc, v];
			},
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
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore
	state.expandedStatus[meta.arg.conversationId] = 'pending';
}

function getConvRejected(state: ConversationsStateType, { meta }: any): void {
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore
	state.expandedStatus[meta.arg.conversationId] = 'error';
}

export const conversationsSlice = createSlice({
	name: 'conversations',
	initialState: {
		currentFolder: '2',
		conversations: {},
		expandedStatus: {},
		searchedInFolder: {},
		status: 'empty'
	} as ConversationsStateType,
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

export function selectConversations({ conversations }: StateType): Record<string, any> {
	return conversations?.conversations;
}

export function selectCurrentFolderExpandedStatus({
	conversations
}: StateType): Record<string, string> {
	return conversations.expandedStatus;
}

export function selectConversationExpandedStatus(
	{ conversations }: StateType,
	id: string
): 'pending' | 'error' | 'complete' | undefined {
	return conversations?.expandedStatus?.[id];
}

export function selectFolder({ folders }: StateType, id: string): Folder {
	return folders?.folders?.[id];
}

export function selectCurrentFolder({ conversations }: StateType): string {
	return conversations?.currentFolder;
}

export function selectConversationStatus(state: StateType): ConversationsFolderStatus {
	return state.conversations.status;
}

export function selectSearchedFolder({ conversations }: StateType, id: string): string {
	return conversations?.searchedInFolder?.[id];
}
export function selectConversationsArray({ conversations }: StateType): Array<Conversation> {
	return Object.values(conversations?.conversations ?? []);
}

export function selectFolderSearchStatus(
	{ conversations }: StateType,
	folderId: string
): string | undefined {
	return conversations?.searchedInFolder?.[folderId] ?? undefined;
}
