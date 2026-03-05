/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/* eslint-disable no-param-reassign */
import produce from 'immer';
import { UseBoundStore, StoreApi } from 'zustand';

import { API_REQUEST_STATUS } from 'constants/index';
import { deleteMessagesFromConversation } from 'store/emails/slices/populated-items/utils';
import { SEARCH_INDEX_SLICE_INITIAL_STATE } from 'store/emails/slices/search/search-slice';
import { NormalizedConversation } from 'types/conversations';
import { IncompleteMessage, MailMessage } from 'types/messages';
import { EmailsStoreState, SearchRequestStatus } from 'types/search';

function resetSearchAndPopulatedItems(
	useEmailsStore: UseBoundStore<StoreApi<EmailsStoreState>>
): void {
	useEmailsStore.setState(
		produce((state: EmailsStoreState) => {
			state.searchIndexSlice = SEARCH_INDEX_SLICE_INITIAL_STATE;

			// remove messages that are not in the messageListIndex
			const validMessages = new Set(state.messageIndexSlice.messageListIndex);
			Object.keys(state.populatedItemsSlice.messages)
				.filter((messageId) => !validMessages.has(messageId))
				.forEach((messageId) => {
					delete state.populatedItemsSlice.messages[messageId];
				});

			// remove conversations that are not in the conversationListIndex
			const validConversations = new Set(state.conversationIndexSlice.conversationListIndex);
			Object.keys(state.populatedItemsSlice.conversations)
				.filter((convId) => !validConversations.has(convId))
				.forEach((convId) => {
					delete state.populatedItemsSlice.conversations[convId];
				});
		})
	);
}

function setSearchResultsByConversation(
	conversations: Array<NormalizedConversation>,
	more: boolean,
	useEmailsStore: UseBoundStore<StoreApi<EmailsStoreState>>
): void {
	useEmailsStore.setState(
		produce(({ searchIndexSlice: searchSlice, populatedItemsSlice }: EmailsStoreState) => {
			searchSlice.conversationListIndex = conversations.map((c) => c.id);
			searchSlice.status = API_REQUEST_STATUS.fulfilled;
			searchSlice.messageListIndex = [];
			searchSlice.offset = 0;
			searchSlice.more = more;
			populatedItemsSlice.conversations = conversations.reduce(
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
		produce(({ searchIndexSlice: searchSlice, populatedItemsSlice }: EmailsStoreState) => {
			searchSlice.messageListIndex = messages.map((message) => message.id);
			searchSlice.status = API_REQUEST_STATUS.fulfilled;
			searchSlice.conversationListIndex = [];
			searchSlice.offset = 0;
			searchSlice.more = more;
			populatedItemsSlice.messages = messages.reduce(
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
	const newConversationsIds = conversations.map((c) => c.id);

	useEmailsStore.setState(
		produce((state: EmailsStoreState) => {
			newConversationsIds.forEach((id) => state.searchIndexSlice.conversationListIndex.push(id));
			state.searchIndexSlice.offset = offset;
			state.searchIndexSlice.more = more;
			state.populatedItemsSlice.conversations = conversations.reduce((acc, conv) => {
				acc[conv.id] = conv;
				return acc;
			}, state.populatedItemsSlice.conversations);
		})
	);
}
function handleNotifyConversationsDeletionInSearch(
	conversationIds: Array<string>,
	useEmailsStore: UseBoundStore<StoreApi<EmailsStoreState>>
): void {
	useEmailsStore.setState(
		produce((state: EmailsStoreState) => {
			state.searchIndexSlice.conversationListIndex =
				state.searchIndexSlice.conversationListIndex.filter((id) => !conversationIds.includes(id));
			conversationIds.forEach((id) => {
				delete state.populatedItemsSlice.conversations[id];
			});
		})
	);
}

function handleNotifyMessagesDeletionInSearch(
	messageIds: Array<string>,
	useEmailsStore: UseBoundStore<StoreApi<EmailsStoreState>>
): void {
	useEmailsStore.setState(
		produce((state: EmailsStoreState) => {
			state.searchIndexSlice.messageListIndex = state.searchIndexSlice.messageListIndex.filter(
				(id) => !messageIds.includes(id)
			);
			messageIds.forEach((id) => {
				delete state.populatedItemsSlice.messages[id];
				deleteMessagesFromConversation(messageIds, state);
			});
		})
	);
}

function updateSearchResultsLoadingStatus(
	status: SearchRequestStatus,
	useEmailsStore: UseBoundStore<StoreApi<EmailsStoreState>>
): void {
	useEmailsStore.setState(
		produce(({ searchIndexSlice: searchSlice }: EmailsStoreState) => {
			searchSlice.status = status;
		})
	);
}

function appendMessagesToSearch(
	messages: Array<MailMessage | IncompleteMessage>,
	offset: number,
	useEmailsStore: UseBoundStore<StoreApi<EmailsStoreState>>
): void {
	const newMessageIds = messages.map((message) => message.id);
	useEmailsStore.setState(
		produce((state: EmailsStoreState) => {
			newMessageIds.forEach((messageId) => state.searchIndexSlice.messageListIndex.push(messageId));
			state.searchIndexSlice.offset = offset;
			state.populatedItemsSlice.messages = messages.reduce((acc, msg) => {
				acc[msg.id] = msg;
				return acc;
			}, state.populatedItemsSlice.messages);
		})
	);
}

function setMessagesInSearchSlice(
	messages: Array<MailMessage | IncompleteMessage>,
	useEmailsStore: UseBoundStore<StoreApi<EmailsStoreState>>
): void {
	useEmailsStore.setState((state: EmailsStoreState) => ({
		searchIndexSlice: {
			...state.searchIndexSlice,
			messageListIndex: messages.map((c) => c.id)
		},
		populatedItemsSlice: {
			...state.populatedItemsSlice,
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
	setSearchResultsByConversation,
	setSearchResultsByMessage,
	resetSearchAndPopulatedItems,
	appendConversationsToSearch,
	handleNotifyConversationsDeletionInSearch,
	handleNotifyMessagesDeletionInSearch,
	updateSearchResultsLoadingStatus,
	appendMessagesToSearch,
	setMessagesInSearchSlice
};
