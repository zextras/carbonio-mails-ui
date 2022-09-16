/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
/* eslint-disable @typescript-eslint/explicit-function-return-type */

import { FOLDERS } from '@zextras/carbonio-shell-ui';
import { createSlice } from '@reduxjs/toolkit';
import produce from 'immer';
import {
	sortBy,
	includes,
	map,
	cloneDeep,
	forEach,
	find,
	last,
	filter,
	omit,
	reduce,
	some,
	indexOf,
	findIndex
} from 'lodash';
import {
	ConvActionParameters,
	ConversationsStateType,
	ConvMessage,
	FetchConversationsReturn,
	Payload,
	SearchesStateType,
	StateType
} from '../types';
import { msgAction, search } from './actions';

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
		state.conversations = sortBy(Object.values(payload?.conversations ?? []), 'date').reverse();
		state.messages = Object.values(payload?.messages ?? []).reverse();
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
		state.conversations = state.conversations
			? map(state.conversations, (conv) => ({
					...conv,
					messages: map(conv.messages, (msg) => {
						if (includes(meta.arg.ids, msg.id)) {
							return { ...msg, parent: FOLDERS.TRASH };
						}
						return msg;
					})
			  }))
			: [];
		state.messages = state.messages
			? map(state.messages, (msg) => {
					if (includes(meta.arg.ids, msg.id)) {
						return { ...msg, parent: FOLDERS.TRASH };
					}
					return msg;
			  })
			: [];
	}
};

export const handleCreatedMessagesInSearchConvReducer = (
	state: ConversationsStateType,
	{ payload }: Payload
): void => {
	const { m } = payload;
	console.log('mmmm:', { payload: cloneDeep(payload), state: cloneDeep(state) });
	forEach(m, (msg) => {
		const indexOfElement = indexOf(state.conversations, find(state.conversations, { id: msg.cid }));
		const conversation = find(state.conversations, { cid: msg.cid || msg.id });
		console.log('mmmm:2', { indexOfElement: cloneDeep(indexOfElement) });
		if (msg?.cid && msg?.id && msg?.l && conversation) {
			const messages = find(conversation.messages, ['id', msg.id])
				? conversation.messages
				: [...conversation.messages, { id: msg.id, parent: msg.l, date: Number(msg.d) }];

			const date =
				msg.l === FOLDERS.DRAFTS
					? conversation.date
					: last(sortBy(filter(messages, { parent: state.currentFolder }), 'date'))?.date;

			const conv = {
				...conversation,
				messages,
				fragment: msg?.fr,
				date
			};

			state.conversations[indexOfElement] = conv;
		}
		if (indexOfElement === -1) {
			//	state.reload = true;
		}
	});
};
export const handleAddMessagesInConversationReducer = (
	state: ConversationsStateType,
	{ payload }: Payload
): void => {
	console.log('mmmm:', { state: cloneDeep(state) });
	forEach(payload, (msg) => {
		const addMsg = omit(msg, ['conversation']) as ConvMessage;

		if (msg?.conversation && find(state?.conversations, { id: msg?.conversation })) {
			const indexOfElement = indexOf(
				state.conversations,
				find(state.conversations, { id: msg.conversation })
			);

			console.log('mmmm:', { indexOfElement: cloneDeep(indexOfElement) });
			state.conversations[indexOfElement] = {
				...state.conversations[indexOfElement],
				messages: [...state.conversations[msg.conversation].messages, addMsg]
			};
		}
	});
};

export const handleDeletedMessagesInConversationReducer = (
	state: ConversationsStateType,
	{ payload }: Payload
): void => {
	state.reload = true;
	// console.log('mmmm:delete:', { state: cloneDeep(state), payload: cloneDeep(payload) });
	// state.conversations = reduce(
	// 	state.conversations,
	// 	(acc, conv) => {
	// 		if (some(payload, (id) => id === conv.id)) return acc;
	// 		if (filter(conv.messages, (msg) => !some(payload, (id) => id === msg.id)).length > 0) {
	// 			acc.push({
	// 				...conv,
	// 				messages: filter(conv.messages, (msg) => !some(payload, (id) => id === msg.id))
	// 			});
	// 		}

	// 		return acc;
	// 	},
	// 	[]
	// );
};
export const handleModifiedMessagesInConversationReducer = (
	state: ConversationsStateType,
	{ payload }: Payload
): void => {
	state.conversations = reduce(
		state.conversations,
		(acc, conv) => ({
			...acc,
			[conv.id]: {
				...conv,
				messages: map(conv.messages, (msg) => {
					const messageToUpdate = find(payload, (item) => item.id === msg.id);
					return messageToUpdate
						? {
								...msg,
								...messageToUpdate
						  }
						: msg;
				})
			}
		}),
		{}
	);
};

export const setReloadReducer = (state: ConversationsStateType, { payload }: Payload): void => {
	state.reload = payload;
};
export const searchesSlice = createSlice({
	name: 'searches',
	initialState: {
		conversations: [],
		messages: [],
		more: false,
		offset: 0,
		sortBy: 'dateDesc',
		query: '',
		status: 'empty',
		loadingMessage: '',
		parent: '',
		reload: true
	} as SearchesStateType,
	reducers: {
		setReload: (state, { payload }) => {
			console.log('abc:', { reload: cloneDeep(payload) });
			state.reload = payload;
			return state;
		},
		handleCreatedMessagesInSearchConversation: produce(handleCreatedMessagesInSearchConvReducer),
		handleAddMessagesInSearchConversation: produce(handleAddMessagesInConversationReducer),
		handleDeletedMessagesInSearchConversation: produce(handleDeletedMessagesInConversationReducer),
		handleModifiedMessagesInSearchConversation: produce(handleModifiedMessagesInConversationReducer)
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
	setReload
} = searchesSlice.actions;
export const searchesSliceReducer = searchesSlice.reducer;

export const selectSearches = ({ searches }: StateType): SearchesStateType => searches;

export const selectSearchesStatus = ({ searches }: StateType): string => searches.status;
export const reloadSelector = ({ searches }: StateType): string => searches.reload;
