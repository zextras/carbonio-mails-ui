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
		produce((draft) => {
			draft.messages.messageIds = new Set(messages.map((message) => message.id));
			draft.messages.status = API_REQUEST_STATUS.fulfilled;
			draft.messages.offset = 0;
			draft.messages.more = more;

			draft.populatedItems.messages = messages.reduce(
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
			state.messages.status = status;
		})
	);
}

function resetMessagesAndPopulatedItems(
	useEmailsStore: UseBoundStore<StoreApi<EmailsStoreState>>
): void {
	useEmailsStore.setState(
		produce((state: EmailsStoreState) => {
			state.messages = MESSAGES_INITIAL_STATE;
			state.populatedItems = POPULATED_ITEMS_INITIAL_STATE;
		})
	);
}

export const messageSliceUtils = {
	setMessages,
	updateMessagesResultsLoadingStatus,
	resetMessagesAndPopulatedItems
};
