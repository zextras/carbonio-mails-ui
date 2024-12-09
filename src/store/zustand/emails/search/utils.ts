/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/* eslint-disable no-param-reassign */
import produce, { enableMapSet } from 'immer';
import { UseBoundStore, StoreApi } from 'zustand';

import { SEARCH_INITIAL_STATE } from './search-slice';
import { API_REQUEST_STATUS } from '../../../../constants';
import {
	EmailsStoreState,
	IncompleteMessage,
	MailMessage,
	NormalizedConversation,
	SearchRequestStatus,
	SearchSliceState
} from '../../../../types';
import { POPULATED_ITEMS_INITIAL_STATE } from '../populated-items/populated-items-slice';

function resetSearchAndPopulatedItems(
	useEmailsStore: UseBoundStore<StoreApi<EmailsStoreState>>
): void {
	useEmailsStore.setState(
		produce((state: EmailsStoreState) => {
			state.search = SEARCH_INITIAL_STATE;
			state.populatedItems = POPULATED_ITEMS_INITIAL_STATE;
		})
	);
}

function setSearchResultsByConversation(
	conversations: Array<NormalizedConversation>,
	more: boolean,
	useEmailsStore: UseBoundStore<StoreApi<EmailsStoreState>>
): void {
	useEmailsStore.setState(
		produce(({ search, populatedItems }) => {
			search.conversationIds = new Set(conversations.map((c) => c.id));
			search.status = API_REQUEST_STATUS.fulfilled;
			search.messageIds = new Set();
			search.offset = 0;
			search.more = more;
			populatedItems.conversations = conversations.reduce(
				(acc, conv) => {
					acc[conv.id] = conv;
					return acc;
				},
				{} as Record<string, NormalizedConversation>
			);
		})
	);
}

function setSearchResultsByMessage(
	messages: Array<MailMessage | IncompleteMessage>,
	more: boolean,
	useEmailsStore: UseBoundStore<StoreApi<EmailsStoreState>>
): void {
	useEmailsStore.setState(
		produce(({ search, populatedItems }) => {
			search.messageIds = new Set(messages.map((message) => message.id));
			search.status = API_REQUEST_STATUS.fulfilled;
			search.conversationIds = new Set();
			search.offset = 0;
			search.more = more;
			populatedItems.messages = messages.reduce(
				(acc, message) => {
					acc[message.id] = message;
					return acc;
				},
				{} as Record<string, MailMessage | IncompleteMessage>
			);
		})
	);
}
function appendConversationsToSearch(
	conversations: Array<NormalizedConversation>,
	offset: number,
	more: boolean,
	useEmailsStore: UseBoundStore<StoreApi<EmailsStoreState>>
): void {
	enableMapSet();
	const newConversationsIds = new Set(conversations.map((c) => c.id));

	useEmailsStore.setState(
		produce((state: EmailsStoreState) => {
			newConversationsIds.forEach((id) => state.search.conversationIds.add(id));
			state.search.offset = offset;
			state.search.more = more;
			state.populatedItems.conversations = conversations.reduce((acc, conv) => {
				acc[conv.id] = conv;
				return acc;
			}, state.populatedItems.conversations);
		})
	);
}

function deleteConversationsFromSearch(
	ids: Array<string>,
	useEmailsStore: UseBoundStore<StoreApi<EmailsStoreState>>
): void {
	enableMapSet();
	useEmailsStore.setState(
		produce((state: EmailsStoreState) => {
			ids.forEach((id) => {
				state.search.conversationIds.delete(id);
				delete state.populatedItems.conversations[id];
			});
		})
	);
}

function deleteMessagesFromSearch(
	ids: Array<string>,
	useEmailsStore: UseBoundStore<StoreApi<EmailsStoreState>>
): void {
	enableMapSet();
	useEmailsStore.setState(
		produce((state: EmailsStoreState) => {
			ids.forEach((id) => {
				state.search.messageIds.delete(id);
				delete state.populatedItems.messages[id];
			});
		})
	);
}

function updateSearchResultsLoadingStatus(
	status: SearchRequestStatus,
	useEmailsStore: UseBoundStore<StoreApi<EmailsStoreState>>
): void {
	useEmailsStore.setState(
		produce(({ search }: SearchSliceState) => {
			search.status = status;
		})
	);
}

function appendMessagesToSearch(
	messages: Array<MailMessage | IncompleteMessage>,
	offset: number,
	useEmailsStore: UseBoundStore<StoreApi<EmailsStoreState>>
): void {
	enableMapSet();
	const newMessageIds = new Set(messages.map((message) => message.id));
	useEmailsStore.setState(
		produce((state: EmailsStoreState) => {
			newMessageIds.forEach((messageId) => state.search.messageIds.add(messageId));
			state.search.offset = offset;
			state.populatedItems.messages = messages.reduce((acc, msg) => {
				acc[msg.id] = msg;
				return acc;
			}, state.populatedItems.messages);
		})
	);
}

function setMessagesInSearchSlice(
	messages: Array<MailMessage | IncompleteMessage>,
	useEmailsStore: UseBoundStore<StoreApi<EmailsStoreState>>
): void {
	useEmailsStore.setState((state: EmailsStoreState) => ({
		search: {
			...state.search,
			messageIds: new Set(messages.map((c) => c.id))
		},
		populatedItems: {
			...state.populatedItems,
			offset: 0,
			messages: messages.reduce(
				(acc, msg) => {
					acc[msg.id] = msg;
					return acc;
				},
				{} as Record<string, MailMessage | IncompleteMessage>
			)
		}
	}));
}

export const searchSliceUtils = {
	resetSearchAndPopulatedItems,
	setSearchResultsByConversation,
	setSearchResultsByMessage,
	appendConversationsToSearch,
	deleteConversationsFromSearch,
	deleteMessagesFromSearch,
	updateSearchResultsLoadingStatus,
	appendMessagesToSearch,
	setMessagesInSearchSlice
};
