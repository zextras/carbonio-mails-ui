/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { filter, find, forEach, map, merge, omit, reduce, some } from 'lodash';

import type { ConvMessage, Payload, SearchesStateType } from '../types';

export const handleCreatedConversationsReducer = (
	state: SearchesStateType,
	{ payload }: Payload
): void => {
	forEach(payload, (conv) => {
		if (conv?.id) {
			state.conversations = merge(state.conversations, { [conv.id]: conv });
		}
	});
};

export const handleModifiedConversationsReducer = (
	state: SearchesStateType,
	{ payload }: Payload
): void => {
	forEach(payload, (conv) => {
		if (conv?.id && state?.conversations?.[conv.id]) {
			state.conversations[conv.id] = {
				...merge(state.conversations[conv.id], conv),
				tags: conv.tags
			};
		}
	});
};
export const handleCreatedMessagesInConversationsReducer = (
	state: SearchesStateType,
	{ payload }: Payload
): void => {
	const { m } = payload;
	forEach(m, (msg) => {
		const conversation = state.conversations?.[msg.cid];
		if (msg?.cid && msg?.id && msg?.l && conversation) {
			const messages = find(conversation.messages, ['id', msg.id])
				? conversation.messages
				: [...conversation.messages, { id: msg.id, parent: msg.l, date: Number(msg.d) }];

			const conv = {
				[msg.cid]: {
					...conversation,
					messages,
					fragment: msg?.fr ?? ''
				}
			};

			state.conversations = { ...state.conversations, ...conv };
		}
	});
};

export const handleModifiedMessagesInConversationReducer = (
	state: SearchesStateType,
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

export const handleAddMessagesInConversationReducer = (
	state: SearchesStateType,
	{ payload }: Payload
): void => {
	forEach(payload, (msg) => {
		const addMsg = omit(msg, ['conversation']) as ConvMessage;
		if (msg?.conversation && state?.conversations?.[msg?.conversation]) {
			state.conversations[msg.conversation] = {
				...state.conversations[msg.conversation],
				messages: [...state.conversations[msg.conversation].messages, addMsg]
			};
		}
	});
};

export const handleDeletedConversationsReducer = (
	state: SearchesStateType,
	{ payload }: Payload
): void => {
	forEach(payload, (id) => {
		state.conversations = omit(state.conversations, id);
	});
};

export const handleDeletedMessagesInConversationReducer = (
	state: SearchesStateType,
	{ payload }: Payload
): void => {
	state.conversations = reduce(
		state.conversations,
		(acc, conv) => ({
			...acc,
			[conv.id]: {
				...conv,
				messages: filter(conv.messages, (msg) => !some(payload, (id) => id === msg.id))
			}
		}),
		{}
	);
};
export const handleDeletedMessagesReducer = (
	state: SearchesStateType,
	{ payload }: Payload
): void => {
	forEach(payload, (id) => {
		state.messages = omit(state.messages, id);
	});
};
