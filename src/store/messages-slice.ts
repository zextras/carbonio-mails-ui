/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
/* eslint-disable @typescript-eslint/no-unused-vars */

/* eslint no-param-reassign: ["error", { "props": true, "ignorePropertyModificationsFor": ["state", conversation", "message", "cache", "status"] }] */

import { createSlice } from '@reduxjs/toolkit';
import produce from 'immer';
import { cloneDeep, filter, forEach, map, merge, uniqBy, valuesIn } from 'lodash';
import { normalizeMailMessageFromSoap } from '../normalizations/normalize-message';
import { Conversation, ConvMessage } from '../types/conversation';
import { IncompleteMessage, MailMessage } from '../types/mail-message';
import { MsgMap, MsgStateType, StateType } from '../types/state';
import { showNotification } from '../views/notifications';
import {
	convAction,
	ConvActionResult,
	search,
	FetchConversationsReturn,
	getConv,
	getMsg,
	msgAction,
	MsgActionResult,
	searchConv,
	SearchConvReturn
} from './actions';
import { saveDraft } from './actions/save-draft';
import {
	handleCreatedMessagesReducer,
	handleModifiedMessagesReducer,
	handleDeletedMessagesReducer
} from './sync/message';

function getMsgFulfilled(
	{ messages, status }: MsgStateType,
	{ payload }: { payload: MailMessage }
): void {
	status[payload.id] = 'complete';
	console.log('getMsg Fulfilled Before: ', cloneDeep(messages?.[payload.id]));
	if (payload?.id) {
		merge(messages?.[payload.id] ?? {}, { ...payload, isComplete: true });
	}
	console.log('getMsg Fulfilled After: ', cloneDeep(messages?.[payload.id]));
}

function fetchConversationsFulfilled(
	state: MsgStateType,
	{ payload, meta }: { payload: FetchConversationsReturn; meta: any }
): void {
	if (payload?.messages) {
		merge(state.messages, payload.messages);
	}
	if (payload?.types === 'message') {
		state.searchedInFolder = {
			...state.searchedInFolder,
			[meta.arg.folderId]: 'complete'
		};
	}
}
function saveDraftFulfilled(
	{ messages, status }: MsgStateType,
	{ payload }: { payload: any }
): void {
	const message = normalizeMailMessageFromSoap(payload.resp.m[0], true);
	status[message.id] = 'complete';
	// eslint-disable-next-line no-param-reassign
	messages[message.id] = message;
}
function searchConvFulfilled(
	{ messages, status }: MsgStateType,
	{ payload }: { payload: SearchConvReturn }
): void {
	forEach(payload.messages, (m) => {
		// eslint-disable-next-line no-param-reassign
		messages[m.id] = { ...m, isComplete: true };
		status[m.id] = 'complete';
	});
}

function msgActionFulfilled(
	{ messages }: MsgStateType,
	{ payload, meta }: { payload: MsgActionResult; meta: any }
): // eslint-disable-next-line @typescript-eslint/no-empty-function
void {}

function msgActionRejected({ messages }: MsgStateType, { meta }: { meta: any }): void {
	// eslint-disable-next-line no-param-reassign
	messages = meta.arg.prevCache;
}
function msgActionPending({ messages }: MsgStateType, { meta }: { meta: any }): void {
	const { operation, ids } = meta.arg;
	// eslint-disable-next-line no-param-reassign
	meta.arg.prevCache = messages;
	forEach(ids, (id) => {
		const message = messages[id];
		if (message) {
			if (operation.includes('flag')) {
				message.flagged = !operation.startsWith('!');
			} else if (operation.includes('read')) {
				message.read = !operation.startsWith('!');
			} else if (operation === 'trash') {
				message.parent = '3';
			} else if (operation === 'delete') {
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				delete message[id];
			} else if (operation === 'move') {
				message.parent = meta.arg.parent;
			} else if (operation === 'spam') {
				message.parent = '4';
				// eslint-disable-next-line no-param-reassign
				delete messages[id];
			} else if (operation === '!spam') {
				message.parent = '2';
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				delete message[id];
			}
		}
	});
}

function getConvFulfilled(
	{ messages, status }: MsgStateType,
	{ payload, meta }: { payload: Partial<Conversation>; meta: any }
): void {
	forEach(payload.messages, (m) => {
		// eslint-disable-next-line no-param-reassign
		messages[m.id] = m;
		status[m.id] = 'complete';
	});
}

export const messagesSlice = createSlice({
	name: 'messages',
	initialState: {
		messages: {} as MsgMap,
		status: {}
	} as MsgStateType,
	reducers: {
		handleCreatedMessages: produce(handleCreatedMessagesReducer),
		handleModifiedMessages: produce(handleModifiedMessagesReducer),
		handleDeletedMessages: produce(handleDeletedMessagesReducer)
	},
	extraReducers: (builder) => {
		builder.addCase(getMsg.fulfilled, produce(getMsgFulfilled));
		builder.addCase(searchConv.fulfilled, produce(searchConvFulfilled));
		builder.addCase(msgAction.fulfilled, produce(msgActionFulfilled));
		builder.addCase(msgAction.pending, produce(msgActionPending));
		builder.addCase(msgAction.rejected, produce(msgActionRejected));
		builder.addCase(getConv.fulfilled, produce(getConvFulfilled));
		builder.addCase(saveDraft.fulfilled, produce(saveDraftFulfilled));
		builder.addCase(search.fulfilled, produce(fetchConversationsFulfilled));
	}
});

export const { handleCreatedMessages, handleModifiedMessages, handleDeletedMessages } =
	messagesSlice.actions;
export const messageSliceReducer = messagesSlice.reducer;

export function selectMessage(state: StateType, id: string): Partial<MailMessage> {
	return state?.messages?.messages?.[id];
}

export function selectMessages(state: StateType): MsgMap {
	return state?.messages?.messages;
}

export function selectMessagesArray(state: StateType): Array<Partial<MailMessage>> {
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore
	return Object.values(state?.messages?.messages ?? []).sort((a, b) => b.date - a.date);
}

export function selectMessagesStatus(state: StateType): Record<string, string> {
	return state?.messages?.status;
}

export function selectFolderMsgSearchStatus(
	{ messages }: StateType,
	folderId: string
): string | undefined {
	return messages?.searchedInFolder?.[folderId] ?? undefined;
}
