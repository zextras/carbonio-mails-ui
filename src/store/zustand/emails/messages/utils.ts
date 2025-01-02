/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/* eslint-disable no-param-reassign */
import produce from 'immer';
import { filter, find, forEach, last, sortBy } from 'lodash';
import { StoreApi, UseBoundStore } from 'zustand';

import { MESSAGE_INDEX_SLICE_INITIAL_STATE } from './messages-slice';
import { FOLDERS } from '../../../../carbonio-ui-commons/constants/folders';
import { useFolder } from '../../../../carbonio-ui-commons/store/zustand/folder';
import { API_REQUEST_STATUS } from '../../../../constants';
import {
	ConvMessage,
	EmailsStoreState,
	IncompleteMessage,
	MailMessage,
	MessageIndexSliceState,
	SearchRequestStatus
} from '../../../../types';
import { POPULATED_ITEMS_SLICE_INITIAL_STATE } from '../populated-items/populated-items-slice';

function setMessages(
	messages: Array<MailMessage | IncompleteMessage>,
	more: boolean,
	useEmailsStore: UseBoundStore<StoreApi<EmailsStoreState>>
): void {
	useEmailsStore.setState(
		produce((store: EmailsStoreState) => {
			store.messageIndexSlice.messageListIndex = messages.map((message) => message.id);
			store.messageIndexSlice.status = API_REQUEST_STATUS.fulfilled;
			store.messageIndexSlice.offset = 0;
			store.messageIndexSlice.more = more;

			store.populatedItemsSlice.messages = messages.reduce(
				(acc, message) => {
					acc[message.id] = message;
					return acc;
				},
				{} as Record<string, MailMessage | IncompleteMessage>
			);
		})
	);
}

function useMessagesIdsByFolder(
	folderId: string,
	useEmailsStore: UseBoundStore<StoreApi<EmailsStoreState>>
): Array<string> {
	const { populatedItemsSlice, messageIndexSlice } = useEmailsStore();
	const folder = useFolder(folderId);
	if (!folder) return [];

	const { messageListIndex } = messageIndexSlice;

	const wantedFolder = 'rid' in folder && folder?.rid ? `${folder.zid}:${folder.rid}` : folder.id;

	return messageListIndex.filter(
		(messageId) => populatedItemsSlice.messages[messageId]?.parent === wantedFolder
	);
}

function updateMessagesResultsLoadingStatus(
	status: SearchRequestStatus,
	useEmailsStore: UseBoundStore<StoreApi<EmailsStoreState>>
): void {
	useEmailsStore.setState(
		produce((state: MessageIndexSliceState) => {
			state.messageIndexSlice.status = status;
		})
	);
}

function resetMessagesAndPopulatedItems(
	useEmailsStore: UseBoundStore<StoreApi<EmailsStoreState>>
): void {
	useEmailsStore.setState(
		produce((state: EmailsStoreState) => {
			state.messageIndexSlice = MESSAGE_INDEX_SLICE_INITIAL_STATE;
			state.populatedItemsSlice = POPULATED_ITEMS_SLICE_INITIAL_STATE;
		})
	);
}

function appendMessagesToMessagesSlice(
	messages: Array<MailMessage | IncompleteMessage>,
	offset: number,
	useEmailsStore: UseBoundStore<StoreApi<EmailsStoreState>>
): void {
	const newMessageIds = messages.map((message) => message.id);
	useEmailsStore.setState(
		produce((state: EmailsStoreState) => {
			const uniqueMessageIds = new Set(state.messageIndexSlice.messageListIndex);
			newMessageIds.forEach((messageId) => {
				uniqueMessageIds.add(messageId);
			});
			state.messageIndexSlice.messageListIndex = Array.from(uniqueMessageIds);
			state.messageIndexSlice.offset = offset;
			state.populatedItemsSlice.messages = messages.reduce((acc, msg) => {
				acc[msg.id] = msg;
				return acc;
			}, state.populatedItemsSlice.messages);
		})
	);
}
function oldFunction(m: any, state: any): void {
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
}

function prependMessagesToMessageSlice(
	messages: Array<MailMessage | IncompleteMessage>,
	useEmailsStore: UseBoundStore<StoreApi<EmailsStoreState>>
): void {
	const newMessageIds = messages.map((message) => message.id);

	function addMessagesToMessageSlice(state: EmailsStoreState): void {
		state.populatedItemsSlice.messages = messages.reduce((acc, msg) => {
			acc[msg.id] = msg;
			return acc;
		}, state.populatedItemsSlice.messages);
		state.messageIndexSlice.messageListIndex = Array.from(
			new Set([...newMessageIds, ...state.messageIndexSlice.messageListIndex])
		);
	}

	function addMessagesToConversation(state: EmailsStoreState): void {
		forEach(messages, (msg) => {
			const conversation = state.populatedItemsSlice.conversations?.[msg.conversation];
			if (msg?.conversation && msg?.id && msg?.parent && conversation) {
				const newMessages = find(conversation.messages, ['id', msg.id])
					? conversation.messages
					: [...conversation.messages, { id: msg.id, parent: msg.parent, date: msg.date }];

				// const date =
				// 	msg.parent === FOLDERS.DRAFTS
				// 		? conversation.date
				// 		: (
				// 				last(
				// 					sortBy(filter(newMessages, { parent: state.currentFolder }), 'date')
				// 				) as ConvMessage
				// 			)?.date;

				const conv = {
					[msg.conversation]: {
						...conversation,
						messages: newMessages,
						fragment: msg?.fragment ?? '',
						date: msg.date,
						sortIndex: -JSON.stringify(Date.now())
					}
				};

				state.populatedItemsSlice.conversations = {
					...state.populatedItemsSlice.conversations,
					...conv
				};
			}
		});
	}

	useEmailsStore.setState(
		produce((state: EmailsStoreState) => {
			addMessagesToMessageSlice(state);
			addMessagesToConversation(state);
		})
	);
}

function deleteMessagesFromMessageSlice(
	ids: Array<string>,
	useEmailsStore: UseBoundStore<StoreApi<EmailsStoreState>>
): void {
	useEmailsStore.setState(
		produce((state: EmailsStoreState) => {
			state.messageIndexSlice.messageListIndex = state.messageIndexSlice.messageListIndex.filter(
				(id) => !ids.includes(id)
			);
			ids.forEach((id) => {
				delete state.populatedItemsSlice.messages[id];
			});
		})
	);
}
export const messageIndexSliceUtils = {
	setMessages,
	updateMessagesResultsLoadingStatus,
	resetMessagesAndPopulatedItems,
	appendMessagesToMessagesSlice,
	prependMessagesToMessageSlice,
	deleteMessagesFromMessageSlice,
	useMessagesIdsByFolder
};
