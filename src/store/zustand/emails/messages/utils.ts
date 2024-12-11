/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/* eslint-disable no-param-reassign */
import produce from 'immer';
import { StoreApi, UseBoundStore } from 'zustand';

import { MESSAGES_INITIAL_STATE } from './messages-slice';
import { API_REQUEST_STATUS } from '../../../../constants';
import {
	EmailsStoreState,
	IncompleteMessage,
	MailMessage,
	MessageSliceState,
	SearchRequestStatus
} from '../../../../types';
import { POPULATED_ITEMS_INITIAL_STATE } from '../populated-items/populated-items-slice';

function setMessages(
	messages: Array<MailMessage | IncompleteMessage>,
	more: boolean,
	useEmailsStore: UseBoundStore<StoreApi<EmailsStoreState>>
): void {
	useEmailsStore.setState(
		produce((draft: EmailsStoreState) => {
			draft.messagesSlice.messageIds = new Set(messages.map((message) => message.id));
			draft.messagesSlice.status = API_REQUEST_STATUS.fulfilled;
			draft.messagesSlice.offset = 0;
			draft.messagesSlice.more = more;

			draft.populatedItemsSlice.messages = messages.reduce(
				(acc, message) => {
					acc[message.id] = message;
					return acc;
				},
				{} as Record<string, MailMessage | IncompleteMessage>
			);
		})
	);
}

function updateMessagesResultsLoadingStatus(
	status: SearchRequestStatus,
	useEmailsStore: UseBoundStore<StoreApi<EmailsStoreState>>
): void {
	useEmailsStore.setState(
		produce((state: MessageSliceState) => {
			state.messagesSlice.status = status;
		})
	);
}

function resetMessagesAndPopulatedItems(
	useEmailsStore: UseBoundStore<StoreApi<EmailsStoreState>>
): void {
	useEmailsStore.setState(
		produce((state: EmailsStoreState) => {
			state.messagesSlice = MESSAGES_INITIAL_STATE;
			state.populatedItemsSlice = POPULATED_ITEMS_INITIAL_STATE;
		})
	);
}

function deleteMessagesFromMessageSlice(
	messageIds: Array<string>,
	useEmailsStore: UseBoundStore<StoreApi<EmailsStoreState>>
): void {
	useEmailsStore.setState(
		produce((state: EmailsStoreState) => {
			messageIds.forEach((id) => {
				delete state.populatedItemsSlice.messages[id];
				state.messagesSlice.messageIds.delete(id);
			});
		})
	);
}

export const messageSliceUtils = {
	setMessages,
	updateMessagesResultsLoadingStatus,
	resetMessagesAndPopulatedItems,
	deleteMessagesFromMessageSlice
};
