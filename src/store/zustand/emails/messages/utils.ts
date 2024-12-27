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
import { useFolder } from '../../../../carbonio-ui-commons/store/zustand/folder';
import { API_REQUEST_STATUS } from '../../../../constants';
import {
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
	folderId: string,
	useEmailsStore: UseBoundStore<StoreApi<EmailsStoreState>>
): Set<string> {
	const folderMessagesIds = new Set<string>();
	const folder = useFolder(folderId);
	const { populatedItemsSlice, messageIndexSlice } = useEmailsStore();
	if (!folder) return folderMessagesIds;
	const { messageIdSet } = messageIndexSlice;
	forEach([...messageIdSet], (messageId) => {
		const wantedFolder = 'rid' in folder && folder?.rid ? `${folder.zid}:${folder.rid}` : folder.id;
		if (populatedItemsSlice.messages[messageId]?.parent === wantedFolder) {
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

function prependMessagesToMessageSlice(
	messages: Array<MailMessage | IncompleteMessage>,
	useEmailsStore: UseBoundStore<StoreApi<EmailsStoreState>>
): void {
	enableMapSet();
	const newMessageIds = new Set(messages.map((message) => message.id));
	useEmailsStore.setState(
		produce((state: EmailsStoreState) => {
			state.populatedItemsSlice.messages = messages.reduce((acc, msg) => {
				acc[msg.id] = msg;
				return acc;
			}, state.populatedItemsSlice.messages);
			state.messageIndexSlice.messageIdSet = new Set([
				...newMessageIds,
				...state.messageIndexSlice.messageIdSet
			]);
		})
	);
}

export const messageIndexSliceUtils = {
	setMessages,
	updateMessagesResultsLoadingStatus,
	resetMessagesAndPopulatedItems,
	appendMessagesToMessagesSlice,
	prependMessagesToMessageSlice,
	useMessagesIdsByFolder
};
