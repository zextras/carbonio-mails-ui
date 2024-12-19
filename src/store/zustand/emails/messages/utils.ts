/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/* eslint-disable no-param-reassign */
import produce, { enableMapSet } from 'immer';
import { forEach } from 'lodash';
import { StoreApi, UseBoundStore } from 'zustand';

import { MESSAGE_INDEX_SLICE_INITIAL_STATE } from './messages-slice';
import { API_REQUEST_STATUS } from '../../../../constants';
import {
	EmailsStoreState,
	Folder,
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
			store.messageIndexSlice.messageIdSet = new Set(messages.map((message) => message.id));
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
	folder: Folder,
	useEmailsStore: UseBoundStore<StoreApi<EmailsStoreState>>
): Set<string> {
	const folderMessagesIds = new Set<string>();
	const { populatedItemsSlice, messageIndexSlice: messagesSlice } = useEmailsStore();
	const { messageIdSet: messageIds } = messagesSlice;
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
	enableMapSet();
	const newMessageIds = new Set(messages.map((message) => message.id));
	useEmailsStore.setState(
		produce((state: EmailsStoreState) => {
			newMessageIds.forEach((messageId) => state.messageIndexSlice.messageIdSet.add(messageId));
			state.messageIndexSlice.offset = offset;
			state.populatedItemsSlice.messages = messages.reduce((acc, msg) => {
				acc[msg.id] = msg;
				return acc;
			}, state.populatedItemsSlice.messages);
		})
	);
}

export const messageIndexSliceUtils = {
	setMessages,
	updateMessagesResultsLoadingStatus,
	resetMessagesAndPopulatedItems,
	appendMessagesToMessagesSlice,
	useMessagesIdsByFolder
};
