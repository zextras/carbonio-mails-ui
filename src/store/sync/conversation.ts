/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { cloneDeep, filter, find, forEach, map, merge, omit, reduce, some, uniqBy } from 'lodash';
import { FOLDERS } from '@zextras/carbonio-shell-ui';
import { ConversationsStateType } from '../../types/state';

type Payload = {
	payload: { m: any; t: any };
};

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
			state.conversations[conv.id] = merge(state.conversations[conv.id], conv);
		}
	});
};
/* state.conversations = {
				...state.conversations,
				[msg.cid]: {
					...state.conversations[msg.cid],
					messages: merge(state.conversations[msg.cid].messages, {
						id: msg.id,
						parent: msg.l
					})
				}
			}; */
export const handleCreatedMessagesInConversationsReducer = (
	state: ConversationsStateType,
	{ payload }: Payload
): void => {
	const { m } = payload;

	forEach(m, (msg) => {
		const oldStore = cloneDeep(state.conversations);
		if (msg?.cid && msg?.id && msg?.l && oldStore?.[msg.cid]) {
			const conv = {
				[msg.cid]: {
					...oldStore[msg.cid],
					messages: uniqBy(
						[
							...oldStore[msg.cid].messages,
							{
								id: msg.id,
								parent: msg.l
							}
						],
						'id'
					),
					date: msg?.l === FOLDERS.SENT ? oldStore[msg.cid].date : msg.d
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
								parent: messageToUpdate.parent
						  }
						: msg;
				})
			}
		}),
		{}
	);
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
