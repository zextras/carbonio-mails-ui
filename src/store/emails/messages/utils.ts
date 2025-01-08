/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { getUserSettings } from '@zextras/carbonio-shell-ui';
/* eslint-disable no-param-reassign */
import produce from 'immer';
import { find, forEach } from 'lodash';
import { StoreApi, UseBoundStore } from 'zustand';

import { MESSAGE_INDEX_SLICE_INITIAL_STATE } from './messages-slice';
import { useFolder } from '../../../carbonio-ui-commons/store/zustand/folder';
import { API_REQUEST_STATUS } from '../../../constants';
import {
	ConvMessage,
	EmailsStoreState,
	IncompleteMessage,
	MailMessage,
	MessageIndexSliceState,
	SearchRequestStatus
} from '../../../types';
import { POPULATED_ITEMS_SLICE_INITIAL_STATE } from '../populated-items/populated-items-slice';
import { deleteMessagesFromConversation } from '../populated-items/utils';

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

/**
 * Handles the creation of notify messages by updating the application's email store state.
 *
 * This function processes incoming messages, updates the message slice, and ensures conversations
 * are updated with the new messages in the appropriate order.
 */
function handleNotifyMessagesCreated(
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

	function getOrderedMessagesForConversation(
		convMessages: ConvMessage[],
		message: IncompleteMessage
	): ConvMessage[] {
		const sortOrder = getUserSettings()?.prefs?.zimbraPrefConversationOrder || 'dateDesc';
		if (sortOrder === 'dateDesc') {
			return [{ id: message.id, parent: message.parent, date: message.date }, ...convMessages];
		}
		return [...convMessages, { id: message.id, parent: message.parent, date: message.date }];
	}

	function addMessagesToConversation(state: EmailsStoreState): void {
		forEach(messages, (msg) => {
			const conversation = state.populatedItemsSlice.conversations?.[msg.conversation];
			if (msg?.conversation && msg?.id && msg?.parent && conversation) {
				const newMessages = find(conversation.messages, ['id', msg.id])
					? conversation.messages
					: getOrderedMessagesForConversation(conversation.messages, msg);

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

/**
 * Deletes specified messages from the message slice in the state, including their references
 * in the message list index and populated items.
 *
 * @param messageIds - An array of message IDs to be removed from the message slice and the message list index.
 * @param useEmailsStore - A state management hook for accessing and updating the `EmailsStoreState`.
 *
 * @remarks
 * - The specified message IDs are removed from the `messageListIndex` and the `populatedItemsSlice.messages`.
 * - The `deleteMessagesFromConversation` function is called to handle any updates to conversations
 *   affected by the deletion of these messages.
 */
function deleteMessagesFromMessageSlice(
	messageIds: Array<string>,
	useEmailsStore: UseBoundStore<StoreApi<EmailsStoreState>>
): void {
	useEmailsStore.setState(
		produce((state: EmailsStoreState) => {
			const messageIdsSet = new Set(messageIds);

			state.messageIndexSlice.messageListIndex = state.messageIndexSlice.messageListIndex.filter(
				(id) => !messageIdsSet.has(id)
			);

			messageIds.forEach((id) => {
				delete state.populatedItemsSlice.messages[id];
			});

			deleteMessagesFromConversation(messageIds, state);
		})
	);
}

export const messageIndexSliceUtils = {
	setMessages,
	handleNotifyMessagesCreated,
	updateMessagesResultsLoadingStatus,
	resetMessagesAndPopulatedItems,
	appendMessagesToMessagesSlice,
	deleteMessagesFromMessageSlice,
	useMessagesIdsByFolder
};
