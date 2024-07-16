/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { FOLDERS } from '@zextras/carbonio-shell-ui/lib/constants';
import { filter, find, forEach, map, merge, omit, reduce, some, last, sortBy } from 'lodash';

import type { ConvMessage, ConversationsStateType, Payload } from '../../types';

export const handleCreatedConversationsReducer = (
	state: ConversationsStateType,
	{ payload }: Payload
): void => {
	forEach(payload, (conv) => {
		if (conv?.id) {
			state.conversations = merge(state.conversations, {
				[conv.id]: { ...conv, sortIndex: -JSON.stringify(Date.now()) }
			});
		}
	});
};

export const handleModifiedConversationsReducer = (
	state: ConversationsStateType,
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
	state: ConversationsStateType,
	{ payload }: Payload
): void => {
	const { m } = payload;

	forEach(m, (msg) => {
		const conversation = state.conversations?.[msg.cid];
		if (msg?.cid && msg?.id && msg?.l && conversation) {
			const messages = find(conversation.messages, ['id', msg.id])
				? conversation.messages
				: [...conversation.messages, { id: msg.id, parent: msg.l, date: Number(msg.d) }];

			const date =
				msg.l === FOLDERS.DRAFTS
					? conversation.date
					: (last(sortBy(filter(messages, { parent: state.currentFolder }), 'date')) as ConvMessage)
							?.date;

			const conv = {
				[msg.cid]: {
					...conversation,
					messages,
					fragment: msg?.fr ?? '',
					date,
					sortIndex: -JSON.stringify(Date.now())
				}
			};

			state.conversations = { ...state.conversations, ...conv };
		}
	});
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
					return messageToUpdate ? { ...msg, ...messageToUpdate } : msg;
				})
			}
		}),
		{}
	);
};

export const handleAddMessagesInConversationReducer = (
	state: ConversationsStateType,
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
	state: ConversationsStateType,
	{ payload }: Payload
): void => {
	forEach(payload, (id) => {
		state.conversations = omit(state.conversations, id);
	});
};

export const handleDeletedMessagesInConversationReducer = (
	state: ConversationsStateType,
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
