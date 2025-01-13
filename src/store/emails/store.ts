/* eslint-disable no-param-reassign */
/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { create, StoreApi, UseBoundStore } from 'zustand';

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
} from '../../types';
import { syncDataHandlerUtils } from './sync-data-handler/utils';

type TaskManagement = {
	queue: Array<() => Promise<void>>;
	isExecuting: boolean;
	addTask: (task: () => Promise<void>) => void;
	executeTasks: () => Promise<void>;
};

const useEmailsStore = create<EmailsStoreState & TaskManagement>()((set, get, ...a) => ({
	...createSearchIndexSlice(set, get, ...a),
	...createMessageIndexSlice(set, get, ...a),
	...createConversationIndexSlice(set, get, ...a),
	...createPopulatedItemsSlice(set, get, ...a),

	queue: [],
	isExecuting: false,

	// Add a task to the queue
	addTask: (task): void => {
		if (typeof task !== 'function') {
			console.error('Invalid task. Task must be a function that returns a Promise.');
			return;
		}

		const { queue, isExecuting } = get();
		set({ queue: [...queue, task] });

		if (!isExecuting) {
			get().executeTasks();
		}
	},

	// Execute tasks sequentially
	executeTasks: async (): Promise<void> => {
		const { isExecuting } = get();

		if (isExecuting) {
			return;
		}

		set({ isExecuting: true });

		try {
			while (get().queue.length > 0) {
				const { queue } = get();
				const [currentTask, ...restQueue] = queue;

				set({ queue: restQueue });

				if (typeof currentTask === 'function') {
					try {
						// eslint-disable-next-line no-await-in-loop
						await currentTask();
					} catch (error) {
						console.error('Task execution failed:', error);
					}
				} else {
					console.warn('Skipping invalid task:', currentTask);
				}
			}
		} finally {
			set({ isExecuting: false });
		}
	}
}));

const { addTask } = useEmailsStore.getState();

// ################################
// ##### Search related functions
// ################################

// TODO: CO-1725 see how this interfers with message and covnersation lists
/**
 * Resets the search and populated items state slices in the EmailsStore.
 *
 * This function modifies the state of the emailsStore by resetting
 * the `searchIndexSlice` and `populatedItemsSlice` properties to their initial states
 *
 */
export function resetSearchAndPopulatedItems(): void {
	addTask(async () => {
		searchSliceUtils.resetSearchAndPopulatedItems(useEmailsStore);
	});
}

/**
 * Updates the search results and populated items in the EmailsStore based on the provided messages.
 *
 * This function sets the `messageListIndex` in the `searchIndexSlice` to an array of message IDs,
 * marks the search status as `fulfilled`, clears the `conversationListIndex`, resets the offset to 0,
 * and updates the `more` flag. It also populates the `messages` field in the `populatedItemsSlice`
 * with the provided messages, indexed by their IDs.
 *
 */
export function setSearchResultsByMessage(
	messages: Array<MailMessage | IncompleteMessage>,
	more: boolean
): void {
	addTask(async () => {
		searchSliceUtils.setSearchResultsByMessage(messages, more, useEmailsStore);
	});
}

/**
 * Custom hook to access the `searchIndexSlice` state from the EmailsStore.
 *
 * This hook retrieves and returns the `searchIndexSlice` portion of the state
 * from the EmailsStore.
 *
 */
export function useSearchResults(): SearchIndexSliceState['searchIndexSlice'] {
	return useEmailsStore(({ searchIndexSlice: searchSlice }) => searchSlice);
}

/**
 * Updates the search results and populated items in the EmailsStore based on the provided conversations.
 *
 * This function sets the `conversationListIndex` in the `searchIndexSlice` to an array of conversation IDs,
 * marks the search status as `fulfilled`, clears the `messageListIndex`, resets the offset to 0,
 * and updates the `more` flag. It also populates the `conversations` field in the `populatedItemsSlice`
 * with the provided conversations, indexed by their IDs.
 *
 */
export function setSearchResultsByConversation(
	conversations: Array<NormalizedConversation>,
	more: boolean
): void {
	addTask(async () => {
		searchSliceUtils.setSearchResultsByConversation(conversations, more, useEmailsStore);
	});
}

/**
 * Appends conversations to the search results and updates the state in the EmailsStore.
 *
 * This function adds new conversation IDs to the `conversationListIndex` in the `searchIndexSlice`,
 * updates the offset and `more` flag, and populates the `conversations` field in the `populatedItemsSlice`
 * with the provided conversations, maintaining the existing conversations.
 *
 */
export function appendConversations(
	conversations: Array<NormalizedConversation>,
	offset: number,
	more: boolean
): void {
	addTask(async () => {
		searchSliceUtils.appendConversationsToSearch(conversations, offset, more, useEmailsStore);
	});
}

/**
 * Handles the deletion of conversations from the search results and updates the EmailsStore state.
 *
 * This function removes specified conversation IDs from the `conversationListIndex` in the `searchIndexSlice`
 * and deletes the corresponding conversation data from the `populatedItemsSlice.conversations`.
 *
 */
export function handleNotifyConversationsDeletionInSearch(
	conversationIdsToRemove: Array<string>
): void {
	addTask(async () => {
		searchSliceUtils.handleNotifyConversationsDeletionInSearch(
			conversationIdsToRemove,
			useEmailsStore
		);
	});
}

/**
 * Handles the deletion of messages from the search results and updates the EmailsStore state.
 *
 * This function removes specified message IDs from the `messageListIndex` in the `searchIndexSlice`
 * and deletes the corresponding message data from the `populatedItemsSlice.messages`. It also ensures
 * messages are removed from conversations using `deleteMessagesFromConversation`.
 */
export function handleNotifyMessagesDeletionInSearch(messageIds: Array<string>): void {
	addTask(async () => {
		searchSliceUtils.handleNotifyMessagesDeletionInSearch(messageIds, useEmailsStore);
	});
}

/**
 * Updates the loading status of the search results in the EmailsStore.
 *
 * This function sets the `status` field in the `searchIndexSlice` to the specified value.
 */
export function updateSearchResultsLoadingStatus(status: SearchRequestStatus): void {
	addTask(async () => {
		searchSliceUtils.updateSearchResultsLoadingStatus(status, useEmailsStore);
	});
}

/**
 * Appends messages to the search results and updates the EmailsStore state.
 *
 * This function adds at the bottom of the array new message IDs to the `messageListIndex` in the `searchIndexSlice`, updates the offset,
 * and populates the `messages` field in the `populatedItemsSlice` with the provided messages, maintaining the existing messages.
 */
export function appendMessagesToSearch(
	messages: Array<MailMessage | IncompleteMessage>,
	offset: number
): void {
	addTask(async () => {
		searchSliceUtils.appendMessagesToSearch(messages, offset, useEmailsStore);
	});
}

/**
 * Sets the messages in the search slice of the EmailsStore.
 *
 * This function updates the `messageListIndex` in the `searchIndexSlice` with the provided message IDs
 * and replaces the `messages` in the `populatedItemsSlice` with the provided messages, resetting the offset to 0.
 */
function setMessagesInSearchSlice(messages: Array<MailMessage | IncompleteMessage>): void {
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

/**
 * Queues a task to update the state with modified conversation data.
 *
 * @param updatedConversations - An array of updated conversation objects, each containing an `id`
 * and other properties to update in the state.
 */

export function updateConversations(updatedConversations: Array<NormalizedConversation>): void {
	addTask(async () => {
		populatedItemsSliceUtils.updateConversations(updatedConversations, useEmailsStore);
	});
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

export function useMessageIndexSlice(): EmailsStoreState['messageIndexSlice'] {
	return useEmailsStore(({ messageIndexSlice }) => messageIndexSlice);
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

/**
 * Queues a task to delete messages from the message slice in the state.
 *
 * @param messageIds - An array of message IDs to be deleted from the message slice.
 */
export function deleteMessagesFromMessagesSlice(messageIds: Array<string>): void {
	addTask(async () => {
		messageIndexSliceUtils.deleteMessagesFromMessageSlice(messageIds, useEmailsStore);
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

// ##########################################
// ##### sync-data-handler related functions
// ##########################################
/**
 * Queues a task to handle the deletion of conversations and messages from search indexes,
 * message and conversation index slices, and the email store state.
 *
 * @param ids - An array of string IDs representing the items to be deleted.
 */
export function handleNotifyDeleted(ids: string[]): void {
	addTask(async () => {
		syncDataHandlerUtils.handleNotifyDeleted(ids, useEmailsStore);
	});
}

/**
 * Queues a task to update the email store state with modified conversation data.
 *
 * @param updatedConversations - An array of `NormalizedConversation` objects,
 * each containing an `id` and other properties to be updated in the state.
 */
export function handleNotifyConversationsModified(
	updatedConversations: Array<NormalizedConversation>
): void {
	addTask(async () => {
		syncDataHandlerUtils.handleNotifyConversationsModified(updatedConversations, useEmailsStore);
	});
}

/**
 * Queues a task to handle the addition of new conversations by updating the email store state.
 *
 * @param conversations - An array of `NormalizedConversation` objects to be
 * added to the conversation slice and index in the email store.
 */
export function handleNotifyConversationsCreated(
	conversations: Array<NormalizedConversation>
): void {
	addTask(async () => {
		syncDataHandlerUtils.handleNotifyConversationsCreated(conversations, useEmailsStore);
	});
}

/**
 * Queues a task to update the email store state with modified message data.
 *
 * @param updatedMessages - An array of `IncompleteMessage` objects, each
 * containing an `id` and other properties to be updated in the state.
 */
export function handleNotifyMessagesModified(updatedMessages: Array<IncompleteMessage>): void {
	addTask(async () => {
		syncDataHandlerUtils.handleNotifyMessagesModified(updatedMessages, useEmailsStore);
	});
}

/**
 * Queues a task to handle the addition of new messages by updating the email store state.
 *
 * @param messages - An array of `MailMessage` or `IncompleteMessage` objects
 * to be added to the message slice and associated conversations.
 */
export function handleNotifyMessagesCreated(
	messages: Array<MailMessage | IncompleteMessage>
): void {
	addTask(async () => {
		syncDataHandlerUtils.handleNotifyMessagesCreated(messages, useEmailsStore);
	});
}

/**
 * Exports the store and hooks for testing purposes only.
 */
export function getUseEmailStoreAndHooksForTesting(): {
	useEmailsStore: UseBoundStore<StoreApi<EmailsStoreState & TaskManagement>>;
	setMessagesInSearchSlice: typeof setMessagesInSearchSlice;
} {
	return { useEmailsStore, setMessagesInSearchSlice };
}
