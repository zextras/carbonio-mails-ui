/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import {
	cloneDeep,
	filter,
	find,
	forEach,
	head,
	isNil,
	map,
	merge,
	omit,
	reduce,
	some,
	sortBy,
	uniqBy
} from 'lodash';
import { FOLDERS } from '@zextras/carbonio-shell-ui';
import { ConversationsStateType } from '../../types/state';
import { ConvMessage } from '../../types/conversation';
import { SyncResponseCreatedMessage } from '../../types/soap/sync';

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

const getNewConversationDate = (
	messages: Array<ConvMessage>,
	currentFolder: string,
	oldDate: number,
	msg: SyncResponseCreatedMessage
): number | undefined =>
	msg.l === FOLDERS.DRAFTS
		? oldDate
		: head(sortBy(filter(messages, { parent: currentFolder }), 'date'))?.date;
export const handleCreatedMessagesInConversationsReducer = (
	state: ConversationsStateType,
	{ payload }: Payload
): void => {
	const { m } = payload;
	forEach(m, (msg) => {
		const conversations = cloneDeep(state.conversations);
		if (msg?.cid && msg?.id && msg?.l && conversations?.[msg.cid]) {
			const conv = {
				[msg.cid]: {
					...conversations[msg.cid],
					messages: uniqBy(
						[
							...conversations[msg.cid].messages,
							{
								id: msg.id,
								parent: msg.l,
								date: msg.d
							}
						],
						'id'
					),
					fragment: msg?.fr,
					date: getNewConversationDate(
						uniqBy(
							[
								...conversations[msg.cid].messages,
								{
									id: msg.id,
									parent: msg.l,
									date: msg.d,
									isSentByMe: !isNil(msg.f) ? /s/.test(msg.f) : false
								}
							],
							'id'
						),
						state.currentFolder,
						conversations[msg.cid].date,
						msg
					)
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
