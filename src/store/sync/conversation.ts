/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { FOLDERS } from '@zextras/carbonio-shell-ui';
import {
	filter,
	cloneDeep,
	find,
	forEach,
	map,
	merge,
	omit,
	reduce,
	some,
	last,
	sortBy
} from 'lodash';
import { ConvMessage, ConversationsStateType, Payload } from '../../types';

export const handleCreatedConversationsReducer = (
	state: ConversationsStateType,
	{ payload }: Payload
): void => {
	forEach(payload, (conv) => {
		if (conv?.id) {
			state.conversations = merge(state.conversations, { [conv.id]: conv });
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

/* const getNewConversationDate = (
	messages: Array<ConvMessage>,
	currentFolder: string,
	oldDate: number,
	msg: SyncResponseCreatedMessage
): number | undefined =>
	msg.l === FOLDERS.DRAFTS
		? oldDate
		: head(sortBy(filter(messages, { parent: currentFolder }), 'date'))?.date; */

export const handleCreatedMessagesInConversationsReducer = (
	state: ConversationsStateType,
	{ payload }: Payload
): void => {
	const { m } = payload;
	console.log('vvvv:', { payload: cloneDeep(payload) });
	forEach(m, (msg) => {
		const conversation = state.conversations?.[msg.cid];
		const searchConversation = state.conversations?.[msg.id];
		if (msg?.cid && msg?.id && msg?.l && conversation) {
			const messages = find(conversation.messages, ['id', msg.id])
				? conversation.messages
				: [...conversation.messages, { id: msg.id, parent: msg.l, date: Number(msg.d) }];

			const date =
				msg.l === FOLDERS.DRAFTS
					? conversation.date
					: last(sortBy(filter(messages, { parent: state.currentFolder }), 'date'))?.date;

			const conv = {
				[msg.cid]: {
					...conversation,
					messages,
					fragment: msg?.fr,
					date
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
	state: ConversationsStateType,
	{ payload }: Payload
): void => {
	console.log('vvvv: msgConv', { payload: cloneDeep(payload) });
	forEach(payload, (msg) => {
		const addMsg = omit(msg, ['conversation']) as ConvMessage;
		console.log('vvvv: msgConv', { addMsg });
		if (msg?.conversation && state?.conversations?.[msg?.conversation]) {
			console.log('vvvv: msgConv hello');
			state.conversations[msg.conversation] = {
				...state.conversations[msg.conversation],
				messages: [...state.conversations[msg.conversation].messages, addMsg]
			};
			// state.conversations[msg.id] = {
			// 	...state.conversations[msg.id],
			// 	messages: [...state.conversations[msg.id].messages, addMsg]
			// };
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
