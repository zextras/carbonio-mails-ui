/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/* eslint-disable no-param-reassign */
import produce, { enableMapSet } from 'immer';
import { forEach } from 'lodash';
import { StoreApi, UseBoundStore } from 'zustand';

import { MESSAGES_INDEX_SLICE_INITIAL_STATE } from './messages-slice';
import { API_REQUEST_STATUS } from '../../../../constants';
import {
	EmailsStoreState,
	Folder,
	IncompleteMessage,
	MailMessage,
	MessagesIndexSliceState,
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
			store.messagesIndexSlice.messagesIds = new Set(messages.map((message) => message.id));
			store.messagesIndexSlice.status = API_REQUEST_STATUS.fulfilled;
			store.messagesIndexSlice.offset = 0;
			store.messagesIndexSlice.more = more;

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
	folder: Folder,
	useEmailsStore: UseBoundStore<StoreApi<EmailsStoreState>>
): Set<string> {
	const folderMessagesIds = new Set<string>();
	const { populatedItemsSlice, messagesIndexSlice: messagesSlice } = useEmailsStore();
	const { messagesIds: messageIds } = messagesSlice;
	forEach([...messageIds], (messageId) => {
		const wantedFolder = 'rid' in folder && folder?.rid ? `${folder.zid}:${folder.rid}` : folder.id;
		if (populatedItemsSlice.messages[messageId].parent === wantedFolder) {
			folderMessagesIds.add(messageId);
		}
	});
	return folderMessagesIds;
}

function updateMessagesResultsLoadingStatus(
	status: SearchRequestStatus,
	useEmailsStore: UseBoundStore<StoreApi<EmailsStoreState>>
): void {
	useEmailsStore.setState(
		produce((state: MessagesIndexSliceState) => {
			state.messagesIndexSlice.status = status;
		})
	);
}

function resetMessagesAndPopulatedItems(
	useEmailsStore: UseBoundStore<StoreApi<EmailsStoreState>>
): void {
	useEmailsStore.setState(
		produce((state: EmailsStoreState) => {
			state.messagesIndexSlice = MESSAGES_INDEX_SLICE_INITIAL_STATE;
			state.populatedItemsSlice = POPULATED_ITEMS_SLICE_INITIAL_STATE;
		})
	);
}

function appendMessagesToMessagesSlice(
	messages: Array<MailMessage | IncompleteMessage>,
	offset: number,
	useEmailsStore: UseBoundStore<StoreApi<EmailsStoreState>>
): void {
	enableMapSet();
	const newMessageIds = new Set(messages.map((message) => message.id));
	useEmailsStore.setState(
		produce((state: EmailsStoreState) => {
			newMessageIds.forEach((messageId) => state.messagesIndexSlice.messagesIds.add(messageId));
			state.messagesIndexSlice.offset = offset;
			state.populatedItemsSlice.messages = messages.reduce((acc, msg) => {
				acc[msg.id] = msg;
				return acc;
			}, state.populatedItemsSlice.messages);
		})
	);
}

export const messagesIndexSliceUtils = {
	setMessages,
	updateMessagesResultsLoadingStatus,
	resetMessagesAndPopulatedItems,
	appendMessagesToMessagesSlice,
	useMessagesIdsByFolder
};
