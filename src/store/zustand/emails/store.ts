/* eslint-disable no-param-reassign */
/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { create } from 'zustand';

import { createMessageSlice } from './messages/messages-slice';
import { createPopulatedItemsSlice } from './populated-items/populated-items-slice';
import { populatedItemsSliceUtils } from './populated-items/utils';
import {
	appendConversationsToSearchHook,
	appendMessagesToSearchHook,
	deleteConversationsFromSearchHook,
	deleteMessagesFromSearchHook,
	resetSearchAndPopulatedItemsHook,
	setMessagesInSearchSliceHook,
	setSearchResultsByConversationHook,
	setSearchResultsByMessageHook,
	updateSearchResultsLoadingStatusHook
} from './search/hooks';
import { createSearchSlice } from './search/search-slice';
import {
	IncompleteMessage,
	MailMessage,
	EmailsStoreState,
	NormalizedConversation,
	SearchRequestStatus,
	SearchSliceState
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
	resetSearchAndPopulatedItemsHook(useEmailsStore);
}
export function setSearchResultsByMessage(
	messages: Array<MailMessage | IncompleteMessage>,
	more: boolean
): void {
	setSearchResultsByMessageHook(messages, more, useEmailsStore);
}
export function useSearchResults(): SearchSliceState['search'] {
	return useEmailsStore(({ search }) => search);
}

export function setSearchResultsByConversation(
	conversations: Array<NormalizedConversation>,
	more: boolean
): void {
	setSearchResultsByConversationHook(conversations, more, useEmailsStore);
}
export function appendConversations(
	conversations: Array<NormalizedConversation>,
	offset: number,
	more: boolean
): void {
	appendConversationsToSearchHook(conversations, offset, more, useEmailsStore);
}
export function deleteConversationsFromSearch(ids: Array<string>): void {
	deleteConversationsFromSearchHook(ids, useEmailsStore);
}
export function deleteMessagesFromSearch(ids: Array<string>): void {
	deleteMessagesFromSearchHook(ids, useEmailsStore);
}
export function getSearchResultsLoadingStatus(): SearchRequestStatus {
	return useEmailsStore.getState().search.status;
}

export function updateSearchResultsLoadingStatus(status: SearchRequestStatus): void {
	updateSearchResultsLoadingStatusHook(status, useEmailsStore);
}
export function appendMessagesToSearch(
	messages: Array<MailMessage | IncompleteMessage>,
	offset: number
): void {
	appendMessagesToSearchHook(messages, offset, useEmailsStore);
}

export function setMessagesInSearchSlice(messages: Array<MailMessage | IncompleteMessage>): void {
	setMessagesInSearchSliceHook(messages, useEmailsStore);
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
	return useEmailsStore(({ populatedItems }) => populatedItems.conversations[id]);
}

export function useMessageById(id: string): IncompleteMessage | MailMessage {
	return useEmailsStore(({ populatedItems }) => populatedItems.messages[id]);
}
export function useConversationStatus(id: string): SearchRequestStatus {
	return useEmailsStore(({ populatedItems }) => populatedItems.conversationsStatus?.[id]);
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
	return useEmailsStore((state) => state.populatedItems.messagesStatus?.[id]);
}

export function removeMessages(messageIds: Array<string>): void {
	populatedItemsSliceUtils.removeMessages(messageIds, useEmailsStore);
}
