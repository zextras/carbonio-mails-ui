/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable unused-imports/no-unused-vars */
/* eslint-disable no-param-reassign */
/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createSelector, createSlice } from '@reduxjs/toolkit';
import { FOLDERS } from '@zextras/carbonio-shell-ui';
import produce from 'immer';
import { forEach, map, merge } from 'lodash';

import { search, getMsg, msgAction, getConv, searchConv } from './actions';
import { deleteAttachments } from './actions/delete-all-attachments';
import { saveDraftAsyncThunk } from './actions/save-draft';
import {
	handleCreatedMessagesReducer,
	handleModifiedMessagesReducer,
	handleDeletedMessagesReducer
} from './sync/message';
import { CONVACTIONS } from '../commons/utilities';
import { SEARCHED_FOLDER_STATE_STATUS } from '../constants';
import { normalizeMailMessageFromSoap } from '../normalizations/normalize-message';
import type {
	MsgMap,
	MsgStateType,
	MailsStateType,
	Conversation,
	MailMessage,
	FetchConversationsReturn,
	SearchConvReturn,
	DeleteAttachmentsReturn,
	MsgMapValue,
	SaveDraftResponse
} from '../types';


const resetMessageReducer = (state: MsgStateType): MsgStateType =>
getMessagesSliceInitialState();

function getMsgFulfilled({ messages }: MsgStateType, { payload }: { payload: MailMessage }): void {
	if (payload?.id) {
		const mergedMessages = merge(messages?.[payload.id] ?? {}, { ...payload, isComplete: true });
		messages[payload.id] = {
			...mergedMessages,
			participants: payload.participants
		};
	}
}

function fetchMessagesRejected(state: MsgStateType, { meta }: { meta: any }): void {
	if (meta.arg.types === 'message') {
		state.searchRequestStatus = meta.requestStatus;
		state.searchedInFolder = {
			...state.searchedInFolder,
			[meta.arg.folderId]: meta.requestStatus
		};
	}
}

function fetchMessagesFulfilled(
	state: MsgStateType,
	{ payload, meta }: { payload: FetchConversationsReturn | undefined; meta: any }
): void {
	if (payload?.messages && payload?.types === 'message') {
		state.searchRequestStatus = meta.requestStatus;
		const newMessagesState =
			payload.offset && payload.offset > 0
				? { ...state.messages, ...payload.messages }
				: { ...payload.messages };
		state.messages = newMessagesState;
		state.searchedInFolder = {
			...state.searchedInFolder,
			[meta.arg.folderId]: payload.hasMore
				? SEARCHED_FOLDER_STATE_STATUS.hasMore
				: SEARCHED_FOLDER_STATE_STATUS.complete
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

function saveDraftFulfilled(
	{ messages, searchRequestStatus }: MsgStateType,
	{ payload, meta }: { payload: { resp: SaveDraftResponse }; meta: any }
): void {
	if (payload.resp.m) {
		const message = normalizeMailMessageFromSoap(payload.resp?.m?.[0], true);
		searchRequestStatus = meta.requestStatus;
		messages[message.id] = message;
	}
}

function searchConvFulfilled(
	{ messages }: MsgStateType,
	{ payload }: { payload: SearchConvReturn }
): void {
	forEach(payload.messages, (m) => {
		messages[m.id] = { ...m, isComplete: true };
	});
}

function msgActionRejected({ messages }: MsgStateType, { meta }: { meta: any }): void {
	messages = meta.arg.prevCache;
}
function msgActionPending(
	{ messages, searchRequestStatus }: MsgStateType,
	{ meta }: { meta: any }
): void {
	const { operation, ids } = meta.arg;
	searchRequestStatus = meta.requestStatus;
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
	{ messages }: MsgStateType,
	{ payload }: { payload: Partial<Conversation> }
): void {
	forEach(payload.messages, (m) => {
		messages[m.id] = m;
		messages[m.id].status = SEARCHED_FOLDER_STATE_STATUS.complete;
	});
}

export const getMessagesSliceInitialState = (): MsgStateType =>
	({
		messages: {} as MsgMap,
		searchRequestStatus: null
	} as MsgStateType);

const selectMessagesSlice = (state: MailsStateType): MailsStateType['messages'] => state.messages;

export const messagesSlice = createSlice({
	name: 'messages',
	initialState: getMessagesSliceInitialState(),
	reducers: {
		resetMessageSlice: resetMessageReducer,
		handleCreatedMessages: produce(handleCreatedMessagesReducer),
		handleModifiedMessages: produce(handleModifiedMessagesReducer),
		handleDeletedMessages: produce(handleDeletedMessagesReducer)
	},
	extraReducers: (builder) => {
		builder.addCase(getMsg.fulfilled, produce(getMsgFulfilled));
		builder.addCase(searchConv.fulfilled, produce(searchConvFulfilled));
		builder.addCase(msgAction.pending, produce(msgActionPending));
		builder.addCase(msgAction.rejected, produce(msgActionRejected));
		builder.addCase(getConv.fulfilled, produce(getConvFulfilled));
		builder.addCase(saveDraftAsyncThunk.fulfilled, produce(saveDraftFulfilled));
		builder.addCase(search.fulfilled, produce(fetchMessagesFulfilled));
		builder.addCase(search.rejected, produce(fetchMessagesRejected));
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

export const selectConvMessages =
	(convIds: Array<string>) =>
	(state: MailsStateType): MsgMap =>
		map(convIds, (id) => ({ [id]: state?.messages?.messages[id] }));

export const selectMessagesArray = createSelector(
	[selectMessagesSlice],
	(slice): Array<MsgMapValue> => Object.values(slice.messages ?? [])
);

export function selectMessagesSearchRequestStatus(
	state: MailsStateType
): MailsStateType['messages']['searchRequestStatus'] {
	return state?.messages?.searchRequestStatus;
}

export const selectFolderMsgSearchStatus =
	(id: string): (({ messages }: MailsStateType) => string | undefined) =>
	({ messages }: MailsStateType): string | undefined =>
		messages?.searchedInFolder?.[id];

export const { resetMessageSlice } = messagesSlice.actions;