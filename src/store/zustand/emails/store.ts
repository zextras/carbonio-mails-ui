/* eslint-disable no-param-reassign */
/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { create } from 'zustand';

import { createMessageSlice } from './messages/messages-slice';
import { messageSliceUtils } from './messages/utils';
import { createPopulatedItemsSlice } from './populated-items/populated-items-slice';
import { populatedItemsSliceUtils } from './populated-items/utils';
import { createSearchSlice } from './search/search-slice';
import { searchSliceUtils } from './search/utils';
import {
	IncompleteMessage,
	MailMessage,
	EmailsStoreState,
	NormalizedConversation,
	SearchRequestStatus,
	SearchSliceState,
	Folder
} from '../../../types';

const useEmailsStore = create<EmailsStoreState>()((...a) => ({
	...createSearchSlice(...a),
	...createMessageSlice(...a),
	...createPopulatedItemsSlice(...a)
}));

// ################################
// ##### Search related functions
// ################################
export function resetSearchAndPopulatedItems(): void {
	searchSliceUtils.resetSearchAndPopulatedItems(useEmailsStore);
}
export function setSearchResultsByMessage(
	messages: Array<MailMessage | IncompleteMessage>,
	more: boolean
): void {
	searchSliceUtils.setSearchResultsByMessage(messages, more, useEmailsStore);
}
export function useSearchResults(): SearchSliceState['searchSlice'] {
	return useEmailsStore(({ searchSlice }) => searchSlice);
}

export function setSearchResultsByConversation(
	conversations: Array<NormalizedConversation>,
	more: boolean
): void {
	searchSliceUtils.setSearchResultsByConversation(conversations, more, useEmailsStore);
}
export function appendConversations(
	conversations: Array<NormalizedConversation>,
	offset: number,
	more: boolean
): void {
	searchSliceUtils.appendConversationsToSearch(conversations, offset, more, useEmailsStore);
}
export function deleteConversationsFromSearch(ids: Array<string>): void {
	searchSliceUtils.deleteConversationsFromSearch(ids, useEmailsStore);
}
export function deleteMessagesFromSearch(ids: Array<string>): void {
	searchSliceUtils.deleteMessagesFromSearch(ids, useEmailsStore);
}
export function getSearchResultsLoadingStatus(): SearchRequestStatus {
	return useEmailsStore.getState().searchSlice.status;
}

export function updateSearchResultsLoadingStatus(status: SearchRequestStatus): void {
	searchSliceUtils.updateSearchResultsLoadingStatus(status, useEmailsStore);
}
export function appendMessagesToSearch(
	messages: Array<MailMessage | IncompleteMessage>,
	offset: number
): void {
	searchSliceUtils.appendMessagesToSearch(messages, offset, useEmailsStore);
}

export function setMessagesInSearchSlice(messages: Array<MailMessage | IncompleteMessage>): void {
	searchSliceUtils.setMessagesInSearchSlice(messages, useEmailsStore);
}

// ################################
// #### Populated Items related functions
// ################################
export function useConversationMessages(
	conversationId: string
): Array<MailMessage | IncompleteMessage> {
	return populatedItemsSliceUtils.useConversationMessages(conversationId, useEmailsStore);
}
export function useConversationById(id: string): NormalizedConversation {
	return useEmailsStore(({ populatedItemsSlice }) => populatedItemsSlice.conversations[id]);
}
export function getMessageById(id: string): IncompleteMessage | MailMessage {
	return useEmailsStore.getState().populatedItemsSlice.messages[id];
}

export function useMessageById(id: string): IncompleteMessage | MailMessage {
	return useEmailsStore(({ populatedItemsSlice }) => populatedItemsSlice.messages[id]);
}
export function useMessagesByIds(ids: Array<string>): Array<IncompleteMessage | MailMessage> {
	return populatedItemsSliceUtils.useMessagesByIds(ids, useEmailsStore);
}

export function useConversationStatus(id: string): SearchRequestStatus {
	return useEmailsStore(({ populatedItemsSlice }) => populatedItemsSlice.conversationsStatus?.[id]);
}

export function updateConversationsOnly(conversations: Array<NormalizedConversation>): void {
	populatedItemsSliceUtils.updateConversationsOnly(conversations, useEmailsStore);
}

export function updateMessagesOnly(messages: Array<IncompleteMessage>): void {
	populatedItemsSliceUtils.updateMessagesOnly(messages, useEmailsStore);
}
export function updateMessages(messages: MailMessage[]): void {
	populatedItemsSliceUtils.updateMessages(messages, useEmailsStore);
}

export function updateConversationStatus(
	conversationId: string,
	status: SearchRequestStatus
): void {
	populatedItemsSliceUtils.updateConversationStatus(conversationId, status, useEmailsStore);
}

export function updateMessageStatus(messageId: string, status: SearchRequestStatus): void {
	populatedItemsSliceUtils.updateMessageStatus(messageId, status, useEmailsStore);
}
export function useMessageStatus(id: string): SearchRequestStatus {
	return useEmailsStore((state) => state.populatedItemsSlice.messagesStatus?.[id]);
}

// ################################
// #### Mail message related functions
// ################################

export function useMessagesSlice(): EmailsStoreState['messagesSlice'] {
	return useEmailsStore(({ messagesSlice }) => messagesSlice);
}

export function useMessagesIdsByFolder(folder: Folder): Set<string> {
	return messageSliceUtils.useMessagesIdsByFolder(folder, useEmailsStore);
}

export function setMessagesInEmailStore(
	messages: Array<MailMessage | IncompleteMessage>,
	more: boolean
): void {
	messageSliceUtils.setMessages(messages, more, useEmailsStore);
}

/**
 * Updates the loading status of the messages results in the email store.
 *
 * @param {SearchRequestStatus} status - The new loading status to set.
 */
export function updateMessagesResultsLoadingStatus(status: SearchRequestStatus): void {
	messageSliceUtils.updateMessagesResultsLoadingStatus(status, useEmailsStore);
}

/**
 * Resets the messages and populated items in the email store.
 */
export function resetMessagesAndPopulatedItems(): void {
	messageSliceUtils.resetMessagesAndPopulatedItems(useEmailsStore);
}

export function appendMessagesToMessagesSlice(
	messages: Array<MailMessage | IncompleteMessage>,
	offset: number
): void {
	messageSliceUtils.appendMessagesToMessagesSlice(messages, offset, useEmailsStore);
}
