/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/* eslint-disable no-param-reassign */
import { useFolder } from '@zextras/carbonio-ui-commons';
import produce from 'immer';
import { StoreApi, UseBoundStore } from 'zustand';

import { API_REQUEST_STATUS } from 'constants/index';
import { MESSAGE_INDEX_SLICE_INITIAL_STATE } from 'store/emails/slices/messages/messages-slice';
import { POPULATED_ITEMS_SLICE_INITIAL_STATE } from 'store/emails/slices/populated-items/populated-items-slice';
import { IncompleteMessage, MailMessage } from 'types/messages';
import { EmailsStoreState, MessageIndexSliceState, SearchRequestStatus } from 'types/search';

function setMessagesInEmailStore(
	messages: Array<MailMessage | IncompleteMessage>,
	useEmailsStore: UseBoundStore<StoreApi<EmailsStoreState>>,
	more?: boolean
): void {
	useEmailsStore.setState(
		produce((store: EmailsStoreState) => {
			store.messageIndexSlice.messageListIndex = messages.map((message) => message.id);
			store.messageIndexSlice.status = API_REQUEST_STATUS.fulfilled;
			store.messageIndexSlice.offset = 0;
			store.messageIndexSlice.more = !!more;

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
	more: boolean,
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
			state.messageIndexSlice.more = more;
			state.populatedItemsSlice.messages = messages.reduce((acc, msg) => {
				acc[msg.id] = msg;
				return acc;
			}, state.populatedItemsSlice.messages);
		})
	);
}

export const messageIndexSliceUtils = {
	setMessagesInEmailStore,
	updateMessagesResultsLoadingStatus,
	resetMessagesAndPopulatedItems,
	appendMessagesToMessagesSlice,
	useMessagesIdsByFolder
};
