/* eslint-disable no-param-reassign */
/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ErrorSoapBodyResponse } from '@zextras/carbonio-shell-ui';
import { create, StoreApi, UseBoundStore } from 'zustand';
import { devtools } from 'zustand/middleware';

import { RemoveAttachmentsResponse } from 'api/delete-all-attachments-soap-api';
import { NormalizedPartialConversation } from 'normalizations/normalize-conversation';
import { createConversationIndexSlice } from 'store/emails/slices/conversations/conversations-index-slice';
import { conversationIndexSliceUtils } from 'store/emails/slices/conversations/utils';
import { createMessageIndexSlice } from 'store/emails/slices/messages/messages-slice';
import { messageIndexSliceUtils } from 'store/emails/slices/messages/utils';
import { createPopulatedItemsSlice } from 'store/emails/slices/populated-items/populated-items-slice';
import { populatedItemsSliceUtils } from 'store/emails/slices/populated-items/utils';
import { createSearchIndexSlice } from 'store/emails/slices/search/search-slice';
import { searchSliceUtils } from 'store/emails/slices/search/utils';
import { syncDataHandlerUtils } from 'store/emails/sync-data-handler/utils';
import { createTaskQueueManager } from 'store/emails/task-management/create-task-queue-manager';
import { ConvActionParameters, NormalizedConversation } from 'types/conversations';
import { IncompleteMessage, MailMessage } from 'types/messages';
import {
	EmailsStoreState,
	PopulatedItemsSliceState,
	SearchIndexSliceState,
	SearchRequestStatus
} from 'types/search';
import { ConvActionResponse } from 'types/soap/conv-action';
import { MsgActionParameters } from 'types/soap/msg-action';
import { PartialIncompleteMessage } from 'views/sidebar/commons/types';

type TaskManagement = {
	queue: Array<() => Promise<void>>;
	isExecuting: boolean;
	addTask: (task: () => Promise<void>) => void;
	executeTasks: () => Promise<void>;
};

const useEmailsStore = create<EmailsStoreState & TaskManagement>()(
	devtools(
		(set, get, ...a) => ({
			...createSearchIndexSlice(set, get, ...a),
			...createMessageIndexSlice(set, get, ...a),
			...createConversationIndexSlice(set, get, ...a),
			...createPopulatedItemsSlice(set, get, ...a),

			/**
			 * TaskQueueManager is a store extension that provides functionality
			 * for managing and executing asynchronous tasks sequentially in a queue.
			 * This implementation safeguards against race conditions.
			 */
			...createTaskQueueManager(set, get, ...a)
		}),
		{ name: 'carbonio-mails-ui' }
	)
);

const { addTask } = useEmailsStore.getState();

// ################################
// ##### Search related functions
// ################################

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

// ###########################################
// #### populatedItemsSlice related functions
// ###########################################

/**
 * Retrieves messages belonging to a specific conversation from the store.
 * This function compiles an array of messages associated with the given conversation ID.
 */
export function useConversationMessages(
	conversationId: string
): Array<MailMessage | IncompleteMessage> {
	return populatedItemsSliceUtils.useConversationMessages(conversationId, useEmailsStore);
}

export function getConversationMessages(
	conversationId: string
): Array<MailMessage | IncompleteMessage> {
	return populatedItemsSliceUtils.getConversationMessages(conversationId, useEmailsStore);
}

export function getConversationMessagesParents(conversationId: string): Array<string> {
	return populatedItemsSliceUtils.getConversationMessagesParents(conversationId, useEmailsStore);
}

/**
 * Handles the response for removing attachments from messages using `deleteAttachmentsSoapApi`
 * and updates the emails store state.
 */
export function handleDeleteAttachments(
	response: RemoveAttachmentsResponse | ErrorSoapBodyResponse
): void {
	addTask(async () => {
		populatedItemsSliceUtils.handleDeleteAttachments(response, useEmailsStore);
	});
}

/**
 * Handles a conversation action response from `convActionSoapApi` and updates the emails store.
 */
export function handleConvActionResponse(
	response: ConvActionResponse | ErrorSoapBodyResponse,
	convActionParams: ConvActionParameters
): void {
	addTask(async () => {
		populatedItemsSliceUtils.handleConvActionResponse(convActionParams, response, useEmailsStore);
	});
}

/**
 * Optimistically handles conversation actions by updating the state of conversations in the emails store.
 *
 * It supports actions such as flagging and marking conversations as
 * read/unread. Updates are applied directly to the `populatedItemsSlice.conversations`.
 */
export function optimisticallyHandleConvActions({ ids, operation }: ConvActionParameters): void {
	addTask(async () => {
		populatedItemsSliceUtils.optimisticallyHandleConvActions({
			ids,
			operation,
			useEmailsStore
		});
	});
}

/**
 * Optimistically handles message actions by updating the state of messages in the emails store.
 *
 * It supports various operations such as flagging, marking as read/unread, moving to folders,
 * tagging, and deleting messages. The updates are applied directly to the `populatedItemsSlice`.
 */
export function optimisticallyHandleMessageActions({
	ids,
	operation,
	parent,
	tagName
}: MsgActionParameters): void {
	addTask(async () => {
		populatedItemsSliceUtils.optimisticallyHandleMessageActions({
			ids,
			operation,
			parent,
			tagName,
			useEmailsStore
		});
	});
}

/**
 * Retrieves the conversation from the populatedItemsSlice of the email store.
 */
export function useConversationById(id: string): NormalizedConversation {
	return useEmailsStore(({ populatedItemsSlice }) => populatedItemsSlice.conversations[id]);
}

/**
 * Provides access to the populated items slice from the emails store.
 * This function retrieves the `populatedItemsSlice` state.
 */
function usePopulatedItemsSlice(): PopulatedItemsSliceState['populatedItemsSlice'] {
	return useEmailsStore((state) => state.populatedItemsSlice);
}

/**
 * Retrieves a message by its id from the `populatedItemsSlice`.
 * This function accesses the emails store to fetch the corresponding message.
 */
export function getMessageById(id: string): IncompleteMessage | MailMessage {
	return useEmailsStore.getState().populatedItemsSlice.messages[id];
}

/**
 * Updates the state with modified conversation data.
 */
export function updateConversations(updatedConversations: Array<NormalizedConversation>): void {
	addTask(async () => {
		populatedItemsSliceUtils.updateConversations(updatedConversations, useEmailsStore);
	});
}

/**
 * Retrieves a conversation by its ID from the populated items slice.
 * This function directly accesses the emails store to fetch the corresponding conversation.
 */
export function getConversationById(id: string): NormalizedConversation {
	return useEmailsStore.getState().populatedItemsSlice.conversations[id];
}

/**
 * Provides access to a specific message by its ID from the populated items slice.
 * If the message is not found, it is not fetched from the server.
 * For fetching the message, use `useCompleteMessageOrFetch` instead.
 */
export function useMessageById(id: string): IncompleteMessage | MailMessage | undefined {
	return useEmailsStore(({ populatedItemsSlice }) => populatedItemsSlice.messages[id]);
}

/**
 * Retrieves messages corresponding to a list of unique identifiers from the `populatedItemsSlice`.
 * This function filters and returns only the valid messages from the emails store, respecting
 * the provided order.
 */
export function useMessagesByIds(ids: Array<string>): Array<IncompleteMessage | MailMessage> {
	return populatedItemsSliceUtils.useMessagesByIds(ids, useEmailsStore);
}

/**
 * Retrieves conversations corresponding to a list of unique identifiers from the `populatedItemsSlice`.
 * This function filters and returns only the conversations that match the provided IDs, respecting
 * the provided order.
 */
export function useConversationsByIds(ids: Array<string>): Array<NormalizedConversation> {
	return populatedItemsSliceUtils.useConversationsByIds(ids, useEmailsStore);
}

/**
 * Retrieves the status of a specific conversation by its unique identifier from the `populatedItemsSlice`.
 * This function accesses the conversation status in the emails store.
 */
export function useConversationStatus(id: string): SearchRequestStatus {
	return useEmailsStore(({ populatedItemsSlice }) => populatedItemsSlice.conversationsStatus?.[id]);
}

/**
 * Updates or replaces messages in the email store `populatedItemsSlice`.
 * - If a message is complete, it replaces the existing message.
 * - If a message is incomplete, it merges with the existing message.
 *
 * If the message is complete the API_REQUEST_STATUS for the message is also
 * updated to 'fulfilled'.
 */
export function updateMessages(messages: MailMessage[]): void {
	addTask(async () => {
		populatedItemsSliceUtils.updateMessages(messages, useEmailsStore);
	});
}

/**
 * Updates the status of a specific conversation in the `populatedItemsSlice` of the emails store.
 * This function modifies the store state to set the provided status for the given conversation ID.
 */
export function updateConversationStatus(
	conversationId: string,
	status: SearchRequestStatus
): void {
	addTask(async () => {
		populatedItemsSliceUtils.updateConversationStatus(conversationId, status, useEmailsStore);
	});
}

/**
 * Updates the status of a specific message in the `populatedItemsSlice` of the emails store.
 * This function modifies the store state to set the provided status for the given message ID.
 */
export function updateMessageStatus(messageId: string, status: SearchRequestStatus): void {
	addTask(async () => {
		populatedItemsSliceUtils.updateMessageStatus(messageId, status, useEmailsStore);
	});
}

/**
 * Retrieves the status of a specific message from the `populatedItemsSlice`.
 * This function accesses the `populatedItemsSlice` to get the status of the given message ID.
 */
export function useMessageStatus(id: string): SearchRequestStatus {
	return useEmailsStore((state) => state.populatedItemsSlice.messagesStatus?.[id]);
}

// ###########################################
// #### messageIndexSlice related functions
// ###########################################

/**
 * Provides access to the `messageIndexSlice` from the emails store.
 * This function retrieves the `messageIndexSlice` state for use in other components or logic.
 */
export function useMessageIndexSlice(): EmailsStoreState['messageIndexSlice'] {
	return useEmailsStore(({ messageIndexSlice }) => messageIndexSlice);
}

/**
 * Retrieves the list of message IDs for a specific folder from the `messageIndexSlice` and `populatedItemsSlice`.
 * This function filters the message IDs based on the folder ID and checks if the messages belong to the specified folder.
 */
export function useMessagesIdsByFolder(folderId: string): Array<string> {
	return messageIndexSliceUtils.useMessagesIdsByFolder(folderId, useEmailsStore);
}

/**
 * Sets a list of messages in the store and updates related state in both the `messageIndexSlice` and `populatedItemsSlice`.
 * This function updates the list of message IDs, status, offset, and the `more` flag in the `messageIndexSlice`,
 * and sets the messages in the `populatedItemsSlice`.
 */
export function setMessagesInEmailStore(
	messages: Array<MailMessage | IncompleteMessage>,
	more?: boolean
): void {
	addTask(async () => {
		messageIndexSliceUtils.setMessagesInEmailStore(messages, useEmailsStore, more);
	});
}

/**
 * Updates the loading status of the messages results in the `messageIndexSlice`.
 * This function modifies the `status` in the `messageIndexSlice` based on the provided loading status.
 */
export function updateMessagesResultsLoadingStatus(status: SearchRequestStatus): void {
	addTask(async () => {
		messageIndexSliceUtils.updateMessagesResultsLoadingStatus(status, useEmailsStore);
	});
}

/**
 * Resets the `messageIndexSlice` and `populatedItemsSlice` in the store to their initial states.
 * This function clears the data in both slices, restoring them to their predefined initial states.
 */
export function resetMessagesAndPopulatedItems(): void {
	addTask(async () => {
		messageIndexSliceUtils.resetMessagesAndPopulatedItems(useEmailsStore);
	});
}

/**
 * Appends new messages to the `messageIndexSlice` and `populatedItemsSlice` in the store.
 * This function adds new message IDs to the existing list, updates the offset, and merges
 * the new messages into the `populatedItemsSlice`.
 */
export function appendMessagesToMessagesSlice(
	messages: Array<MailMessage | IncompleteMessage>,
	offset: number,
	more: boolean
): void {
	addTask(async () => {
		messageIndexSliceUtils.appendMessagesToMessagesSlice(messages, offset, more, useEmailsStore);
	});
}

/**
 * Retrieves the list of messages belonging to a specific folder from the store.
 * This function filters messages based on the folder ID and `parent` reference,
 * returning only the messages belonging to the specified folder.
 */
export function useMessagesByFolder(folderId: string): Array<MailMessage | IncompleteMessage> {
	return populatedItemsSliceUtils.useMessagesByFolder(folderId, useEmailsStore);
}

/**
 * Retrieves the loading status of the message from the `messageIndexSlice`.
 * This function accesses the `status` in the `messageIndexSlice` to indicate
 * the current loading state of message.
 */
export function useMessageLoadingStatus(): SearchRequestStatus {
	return useEmailsStore(({ messageIndexSlice }) => messageIndexSlice.status);
}

// #################################################
// #### conversationIndexSlice related functions
// #################################################
/**
 * Provides access to the `conversationIndexSlice` from the emails store.
 * This function retrieves the `conversationIndexSlice` state for use in other components or logic.
 */
export function useConversationIndexSlice(): EmailsStoreState['conversationIndexSlice'] {
	return useEmailsStore(({ conversationIndexSlice }) => conversationIndexSlice);
}

/**
 * Retrieves the list of conversation IDs that belong to a specific folder from the store.
 * This function filters conversation IDs based on the folder ID and the messages' parent references.
 */
export function useConversationsIdsByFolder(folderId: string): Array<string> {
	return conversationIndexSliceUtils.useConversationsIdsByFolder(folderId, useEmailsStore);
}

/**
 * Resets the `conversationIndexSlice` and `populatedItemsSlice` in the store to their initial states.
 * This function clears the data in both slices, restoring them to their predefined initial states.
 */
function resetConversationAndPopulatedItems(): void {
	addTask(async () => {
		conversationIndexSliceUtils.resetConversationAndPopulatedItems(useEmailsStore);
	});
}

/**
 * Appends new conversations to the `conversationIndexSlice` and `populatedItemsSlice` in the store.
 * This function adds new conversation IDs to the existing list, updates the offset, more, and merges the new conversations into the `populatedItemsSlice`.
 */
export function appendConversationsToConversationIndexSlice(
	conversations: Array<NormalizedConversation>,
	offset: number,
	more: boolean
): void {
	addTask(async () => {
		conversationIndexSliceUtils.appendConversationsToConversationIndexSlice(
			conversations,
			offset,
			more,
			useEmailsStore
		);
	});
}

/**
 * Updates the loading status of the conversations results in the `conversationIndexSlice`.
 * This function modifies the `status` in the `conversationIndexSlice` to reflect the provided loading state.
 */
export function updateConversationsResultsLoadingStatus(status: SearchRequestStatus): void {
	addTask(async () => {
		conversationIndexSliceUtils.updateConversationsResultsLoadingStatus(status, useEmailsStore);
	});
}

/**
 * Retrieves the loading status of the conversations results from the `conversationIndexSlice`.
 * This function accesses the `status` in the `conversationIndexSlice` to indicate the current loading state of conversation results.
 */
export function useConversationsResultsLoadingStatus(): SearchRequestStatus {
	return useEmailsStore(({ conversationIndexSlice }) => conversationIndexSlice.status);
}

/**
 * Sets a list of conversations in the store and updates related state in both the `conversationIndexSlice` and `populatedItemsSlice`.
 * This function updates the list of conversation IDs, status, offset, and the `more` flag in the `conversationIndexSlice`,
 * and sets the conversations in the `populatedItemsSlice`.
 */
export function setConversationsInEmailStore(
	conversations: Array<NormalizedConversation>,
	more: boolean
): void {
	addTask(async () => {
		conversationIndexSliceUtils.setConversationsInEmailStore(conversations, more, useEmailsStore);
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
 * @param partialConversations - An array of `NormalizedConversation` objects,
 * each containing an `id` and other properties to be updated in the state.
 */
export function handleNotifyConversationsModified(
	partialConversations: Array<NormalizedPartialConversation>
): void {
	addTask(async () => {
		syncDataHandlerUtils.handleNotifyConversationsModified(partialConversations, useEmailsStore);
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
 * @param partialMessages - An array of `IncompleteMessage` objects, each
 * containing an `id` and other properties to be updated in the state.
 */
export function handleNotifyMessagesModified(
	partialMessages: Array<PartialIncompleteMessage>
): void {
	addTask(async () => {
		syncDataHandlerUtils.handleNotifyMessagesModified(partialMessages, useEmailsStore);
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
	usePopulatedItemsSlice: typeof usePopulatedItemsSlice;
	resetConversationAndPopulatedItems: typeof resetConversationAndPopulatedItems;
	resetMessagesAndPopulatedItems: typeof resetMessagesAndPopulatedItems;
	resetSearchAndPopulatedItems: typeof resetSearchAndPopulatedItems;
} {
	return {
		useEmailsStore,
		setMessagesInSearchSlice,
		usePopulatedItemsSlice,
		resetConversationAndPopulatedItems,
		resetMessagesAndPopulatedItems,
		resetSearchAndPopulatedItems
	};
}
