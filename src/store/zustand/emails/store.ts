/* eslint-disable no-param-reassign */
/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { create } from 'zustand';

import { createConversationIndexSlice } from './conversations/conversations-index-slice';
import { conversationIndexSliceUtils } from './conversations/utils';
import { createMessageIndexSlice } from './messages/messages-slice';
import { messageIndexSliceUtils } from './messages/utils';
import { createPopulatedItemsSlice } from './populated-items/populated-items-slice';
import { populatedItemsSliceUtils } from './populated-items/utils';
import { createSearchIndexSlice } from './search/search-slice';
import { searchSliceUtils } from './search/utils';
import {
	IncompleteMessage,
	MailMessage,
	EmailsStoreState,
	NormalizedConversation,
	SearchRequestStatus,
	SearchIndexSliceState,
	PopulatedItemsSliceState
} from '../../../types';

const useEmailsStore = create<
	EmailsStoreState & {
		queue: Array<() => Promise<void>>;
		isExecuting: boolean;
		addTask: (task: () => Promise<void>) => void;
		executeTasks: () => Promise<void>;
	}
>()((set, get, ...a) => ({
	...createSearchIndexSlice(set, get, ...a),
	...createMessageIndexSlice(set, get, ...a),
	...createConversationIndexSlice(set, get, ...a),
	...createPopulatedItemsSlice(set, get, ...a),

	queue: [], // Holds the tasks to be executed
	isExecuting: false, // Tracks if execution is in progress

	// Add a task to the queue
	addTask: (task): void => {
		const { queue, isExecuting } = get();
		set({ queue: [...queue, task] });

		// Start executing tasks if not already in progress
		if (!isExecuting) {
			get().executeTasks();
		}
	},

	// Execute tasks sequentially
	executeTasks: async (): Promise<void> => {
		const { isExecuting } = get();

		if (isExecuting) {
			// Guard against overlapping executions
			return;
		}

		set({ isExecuting: true });

		while (get().queue.length > 0) {
			const [currentTask, ...restQueue] = get().queue;

			try {
				// Execute the current task
				currentTask();
			} catch (error) {
				console.error('Task execution failed:', error);
			} finally {
				// Update the queue
				set({ queue: restQueue });
			}
		}

		// Mark execution as complete
		set({ isExecuting: false });
	}
}));

const { addTask } = useEmailsStore.getState();

// ################################
// ##### Search related functions
// ################################
export function resetSearchAndPopulatedItems(): void {
	addTask(async () => {
		searchSliceUtils.resetSearchAndPopulatedItems(useEmailsStore);
	});
}
export function setSearchResultsByMessage(
	messages: Array<MailMessage | IncompleteMessage>,
	more: boolean
): void {
	addTask(async () => {
		searchSliceUtils.setSearchResultsByMessage(messages, more, useEmailsStore);
	});
}
export function useSearchResults(): SearchIndexSliceState['searchIndexSlice'] {
	return useEmailsStore(({ searchIndexSlice: searchSlice }) => searchSlice);
}

export function setSearchResultsByConversation(
	conversations: Array<NormalizedConversation>,
	more: boolean
): void {
	addTask(async () => {
		searchSliceUtils.setSearchResultsByConversation(conversations, more, useEmailsStore);
	});
}
export function appendConversations(
	conversations: Array<NormalizedConversation>,
	offset: number,
	more: boolean
): void {
	addTask(async () => {
		searchSliceUtils.appendConversationsToSearch(conversations, offset, more, useEmailsStore);
	});
}
export function deleteConversationsFromSearch(ids: Array<string>): void {
	addTask(async () => {
		searchSliceUtils.deleteConversationsFromSearch(ids, useEmailsStore);
	});
}
export function deleteMessagesFromSearch(ids: Array<string>): void {
	addTask(async () => {
		searchSliceUtils.deleteMessagesFromSearch(ids, useEmailsStore);
	});
}
export function getSearchResultsLoadingStatus(): SearchRequestStatus {
	return useEmailsStore.getState().searchIndexSlice.status;
}

export function updateSearchResultsLoadingStatus(status: SearchRequestStatus): void {
	addTask(async () => {
		searchSliceUtils.updateSearchResultsLoadingStatus(status, useEmailsStore);
	});
}
export function appendMessagesToSearch(
	messages: Array<MailMessage | IncompleteMessage>,
	offset: number
): void {
	addTask(async () => {
		searchSliceUtils.appendMessagesToSearch(messages, offset, useEmailsStore);
	});
}

export function setMessagesInSearchSlice(messages: Array<MailMessage | IncompleteMessage>): void {
	addTask(async () => {
		searchSliceUtils.setMessagesInSearchSlice(messages, useEmailsStore);
	});
}

// ################################
// #### Populated Items related functions
// ################################
export function useConversationMessages(
	conversationId: string
): Array<MailMessage | IncompleteMessage> {
	return populatedItemsSliceUtils.useConversationMessages(conversationId, useEmailsStore);
}

/**
 * Retrieves the conversation from the populatedItemsSlice of the email store.
 */
export function useConversationById(id: string): NormalizedConversation {
	return useEmailsStore(({ populatedItemsSlice }) => populatedItemsSlice.conversations[id]);
}

export function usePopulatedItemsSlice(): PopulatedItemsSliceState['populatedItemsSlice'] {
	return useEmailsStore((state) => state.populatedItemsSlice);
}
export function getMessageById(id: string): IncompleteMessage | MailMessage {
	return useEmailsStore.getState().populatedItemsSlice.messages[id];
}

export function getConversationById(id: string): NormalizedConversation {
	return useEmailsStore.getState().populatedItemsSlice.conversations[id];
}

export function useMessageById(id: string): IncompleteMessage | MailMessage {
	return useEmailsStore(({ populatedItemsSlice }) => populatedItemsSlice.messages[id]);
}
export function useMessagesByIds(ids: Array<string>): Array<IncompleteMessage | MailMessage> {
	return populatedItemsSliceUtils.useMessagesByIds(ids, useEmailsStore);
}

export function useConversationsByIds(ids: Array<string>): Array<NormalizedConversation> {
	return populatedItemsSliceUtils.useConversationsByIds(ids, useEmailsStore);
}

export function useConversationStatus(id: string): SearchRequestStatus {
	return useEmailsStore(({ populatedItemsSlice }) => populatedItemsSlice.conversationsStatus?.[id]);
}

export function updateConversationsOnly(conversations: Array<NormalizedConversation>): void {
	addTask(async () => {
		populatedItemsSliceUtils.updateConversationsOnly(conversations, useEmailsStore);
	});
}

export function updateMessagesOnly(messages: Array<IncompleteMessage>): void {
	addTask(async () => {
		populatedItemsSliceUtils.updateMessagesOnly(messages, useEmailsStore);
	});
}
export function updateMessages(messages: MailMessage[]): void {
	addTask(async () => {
		populatedItemsSliceUtils.updateMessages(messages, useEmailsStore);
	});
}

export function updateConversationStatus(
	conversationId: string,
	status: SearchRequestStatus
): void {
	addTask(async () => {
		populatedItemsSliceUtils.updateConversationStatus(conversationId, status, useEmailsStore);
	});
}

export function updateMessageStatus(messageId: string, status: SearchRequestStatus): void {
	addTask(async () => {
		populatedItemsSliceUtils.updateMessageStatus(messageId, status, useEmailsStore);
	});
}
export function useMessageStatus(id: string): SearchRequestStatus {
	return useEmailsStore((state) => state.populatedItemsSlice.messagesStatus?.[id]);
}

// ###########################################
// #### messageIndexSlice related functions
// ###########################################

export function useMessagesSlice(): EmailsStoreState['messageIndexSlice'] {
	return useEmailsStore(({ messageIndexSlice: messagesSlice }) => messagesSlice);
}

export function useMessagesIdsByFolder(folderId: string): Array<string> {
	return messageIndexSliceUtils.useMessagesIdsByFolder(folderId, useEmailsStore);
}

export function setMessagesInEmailStore(
	messages: Array<MailMessage | IncompleteMessage>,
	more: boolean
): void {
	addTask(async () => {
		messageIndexSliceUtils.setMessages(messages, more, useEmailsStore);
	});
}

/**
 * Updates the loading status of the messages results in the email store.
 *
 * @param {SearchRequestStatus} status - The new loading status to set.
 */
export function updateMessagesResultsLoadingStatus(status: SearchRequestStatus): void {
	addTask(async () => {
		messageIndexSliceUtils.updateMessagesResultsLoadingStatus(status, useEmailsStore);
	});
}

/**
 * Resets the messages and populated items in the email store.
 */
export function resetMessagesAndPopulatedItems(): void {
	addTask(async () => {
		messageIndexSliceUtils.resetMessagesAndPopulatedItems(useEmailsStore);
	});
}

export function prependMessagesToMessagesSlice(
	messages: Array<MailMessage | IncompleteMessage>
): void {
	addTask(async () => {
		messageIndexSliceUtils.prependMessagesToMessageSlice(messages, useEmailsStore);
	});
}
export function appendMessagesToMessagesSlice(
	messages: Array<MailMessage | IncompleteMessage>,
	offset: number
): void {
	addTask(async () => {
		messageIndexSliceUtils.appendMessagesToMessagesSlice(messages, offset, useEmailsStore);
	});
}
export function useMessagesByFolder(folderId: string): Array<MailMessage | IncompleteMessage> {
	return populatedItemsSliceUtils.useMessagesByFolder(folderId, useEmailsStore);
}

export function deleteMessagesFromMessagesSlice(ids: Array<string>): void {
	addTask(async () => {
		messageIndexSliceUtils.deleteMessagesFromMessageSlice(ids, useEmailsStore);
	});
}

export function useMessagesResultsLoadingStatus(): SearchRequestStatus {
	return useEmailsStore(({ messageIndexSlice }) => messageIndexSlice.status);
}

// ################################
// #### conversationIndexSlice related functions
// ################################

export function useConversationIndexSlice(): EmailsStoreState['conversationIndexSlice'] {
	return useEmailsStore(({ conversationIndexSlice }) => conversationIndexSlice);
}
export function useConversationsIdsByFolder(folderId: string): Array<string> {
	return conversationIndexSliceUtils.useConversationsIdsByFolder(folderId, useEmailsStore);
}

export function resetConversationAndPopulatedItems(): void {
	addTask(async () => {
		conversationIndexSliceUtils.resetConversationAndPopulatedItems(useEmailsStore);
	});
}

export function appendConversationsToConversationIndexSlice(
	conversations: Array<NormalizedConversation>,
	offset: number
): void {
	addTask(async () => {
		conversationIndexSliceUtils.appendConversationsToConversationIndexSlice(
			conversations,
			offset,
			useEmailsStore
		);
	});
}

export function prependConversationsToConversationIndexSlice(
	conversations: Array<NormalizedConversation>
): void {
	addTask(async () => {
		conversationIndexSliceUtils.prependConversationsToConversationIndexSlice(
			conversations,
			useEmailsStore
		);
	});
}

export function updateConversationsResultsLoadingStatus(status: SearchRequestStatus): void {
	addTask(async () => {
		useEmailsStore.setState((state) => ({
			...state,
			conversationIndexSlice: {
				...state.conversationIndexSlice,
				status
			}
		}));
	});
}

export function useConversationsResultsLoadingStatus(): SearchRequestStatus {
	return useEmailsStore(({ conversationIndexSlice }) => conversationIndexSlice.status);
}

export function setConversationsInEmailStore(
	conversations: Array<NormalizedConversation>,
	more: boolean
): void {
	addTask(async () => {
		conversationIndexSliceUtils.setConversations(conversations, more, useEmailsStore);
	});
}
export function deleteConversationsFromConversationSlice(ids: Array<string>): void {
	addTask(async () => {
		conversationIndexSliceUtils.deleteConversationsFromConversationSlice(ids, useEmailsStore);
	});
}
