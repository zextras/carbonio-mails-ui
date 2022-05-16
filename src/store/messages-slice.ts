/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
/* eslint-disable @typescript-eslint/no-unused-vars */

/* eslint no-param-reassign: ["error", { "props": true, "ignorePropertyModificationsFor": ["state", conversation", "message", "cache", "status"] }] */

import { createSlice } from '@reduxjs/toolkit';
import produce from 'immer';
import { cloneDeep, forEach, merge } from 'lodash';
import { normalizeMailMessageFromSoap } from '../normalizations/normalize-message';
import { Conversation } from '../types/conversation';
import { MailMessage } from '../types/mail-message';
import { MsgMap, MsgStateType, StateType } from '../types/state';
import {
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
	if (payload?.id) {
		// eslint-disable-next-line no-param-reassign
		messages[payload.id] = {
			...merge(messages?.[payload.id] ?? {}, { ...payload, isComplete: true }),
			participants: payload.participants
		};
	}
}

function fetchConversationsFulfilled(
	state: MsgStateType,
	{ payload, meta }: { payload: FetchConversationsReturn | undefined; meta: any }
): void {
	if (payload?.messages) {
		if (payload?.types === 'message') {
			merge(state?.messages, payload.messages);
			/*			forEach(payload?.messages, (msg) => {
				if (!state?.messages?.[msg.id] || !state?.messages?.[msg.id]?.isComplete) {
					state.messages[msg.id] = msg;
				}
			}); */
		}
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
			} else if (operation === '!spam') {
				message.parent = '2';
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
	return Object.values(state?.messages?.messages ?? []);
}

export function selectMessagesStatus(state: StateType): Record<string, string> {
	return state?.messages?.status;
}

export const selectFolderMsgSearchStatus =
	(id: string): (({ messages }: StateType) => string | undefined) =>
	({ messages }: StateType): string | undefined =>
		messages?.searchedInFolder?.[id];
