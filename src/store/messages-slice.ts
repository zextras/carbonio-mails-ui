/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
/* eslint-disable @typescript-eslint/no-unused-vars */

/* eslint no-param-reassign: ["error", { "props": true, "ignorePropertyModificationsFor": ["state", conversation", "message", "cache", "status"] }] */

import { createSlice } from '@reduxjs/toolkit';
import { FOLDERS } from '@zextras/carbonio-shell-ui';
import produce from 'immer';
import { forEach, merge, mergeWith } from 'lodash';

import { search, getConv, getMsg, msgAction, searchConv } from './actions';
import { deleteAttachments } from './actions/delete-all-attachments';
import {
	handleCreatedMessagesReducer,
	handleModifiedMessagesReducer,
	handleDeletedMessagesReducer
} from './sync/message';
import { CONVACTIONS } from '../commons/utilities';
import { normalizeMailMessageFromSoap } from '../normalizations/normalize-message';
import type {
	MsgMap,
	MsgStateType,
	MailsStateType,
	Conversation,
	MailMessage,
	FetchConversationsReturn,
	SearchConvReturn,
	MsgActionResult,
	DeleteAttachmentsReturn
} from '../types';

function getMsgFulfilled(
	{ messages, status }: MsgStateType,
	{ payload }: { payload: MailMessage }
): void {
	status[payload.id] = 'complete';
	if (payload?.id) {
		const mergedMessages = merge(messages?.[payload.id] ?? {}, { ...payload, isComplete: true });
		// eslint-disable-next-line no-param-reassign
		messages[payload.id] = {
			...mergedMessages,
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
			mergeWith(state?.messages, payload.messages, (objValue, srcValue, key, object, source) => {
				if (key !== 'participants') {
					return undefined;
				}
				return source.participants;
			});
		}
	}
	if (payload?.types === 'message') {
		state.searchedInFolder = {
			...state.searchedInFolder,
			[meta.arg.folderId]: 'complete'
		};
	}
}

function deleteAttachmentsFulfilled(
	state: MsgStateType,
	{ payload, meta }: { payload: DeleteAttachmentsReturn | undefined; meta: any }
): void {
	if (payload?.attachments?.length && state.messages[meta.arg.id]) {
		const normalizeMsg = normalizeMailMessageFromSoap(payload.res.m[0], true);
		state.messages[meta.arg.id] = { ...state.messages[meta.arg.id], parts: normalizeMsg.parts };
	}
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
			if (operation.includes(CONVACTIONS.FLAG)) {
				message.flagged = !operation.startsWith('!');
			} else if (operation.includes(CONVACTIONS.MARK_READ)) {
				message.read = !operation.startsWith('!');
			} else if (operation === CONVACTIONS.TRASH) {
				message.parent = FOLDERS.TRASH;
			} else if (operation === CONVACTIONS.DELETE) {
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				delete message[id];
			} else if (operation === CONVACTIONS.MOVE) {
				message.parent = meta.arg.parent;
			} else if (operation === CONVACTIONS.MARK_SPAM) {
				message.parent = FOLDERS.SPAM;
			} else if (operation === CONVACTIONS.MARK_NOT_SPAM) {
				message.parent = FOLDERS.INBOX;
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

export const getMessagesSliceInitialState = (): MsgStateType =>
	({
		messages: {} as MsgMap,
		status: {}
	} as MsgStateType);

export const messagesSlice = createSlice({
	name: 'messages',
	initialState: getMessagesSliceInitialState(),
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
		builder.addCase(search.fulfilled, produce(fetchConversationsFulfilled));
		builder.addCase(deleteAttachments.fulfilled, produce(deleteAttachmentsFulfilled));
	}
});

export const { handleCreatedMessages, handleModifiedMessages, handleDeletedMessages } =
	messagesSlice.actions;
export const messageSliceReducer = messagesSlice.reducer;

export function selectMessage(state: MailsStateType, id: string): MailMessage {
	return state?.messages?.messages?.[id];
}

export function selectMessages(state: MailsStateType): MsgMap {
	return state?.messages?.messages;
}

export function selectMessagesArray(state: MailsStateType): Array<MailMessage> {
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore
	return Object.values(state?.messages?.messages ?? []);
}

export function selectMessagesStatus(state: MailsStateType): Record<string, string> {
	return state?.messages?.status;
}

export const selectFolderMsgSearchStatus =
	(id: string): (({ messages }: MailsStateType) => string | undefined) =>
	({ messages }: MailsStateType): string | undefined =>
		messages?.searchedInFolder?.[id];
