/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { getUserSettings } from '@zextras/carbonio-shell-ui';
/* eslint-disable no-param-reassign */
import produce from 'immer';
import { filter, find, forEach, orderBy, toLower } from 'lodash';
import { StoreApi, UseBoundStore } from 'zustand';

import { parseMessageSortingOptions } from '../../../helpers/parseMessageSortingOptions';
import { NormalizedPartialConversation } from 'normalizations/normalize-conversation';
import { NormalizedConversation } from 'types/conversations';
import { IncompleteMessage, MailMessage } from 'types/messages';
import { EmailsStoreState } from 'types/search';
import { PartialIncompleteMessage } from 'views/sidebar/commons/types';

function deleteConversationsInSearch(
	state: EmailsStoreState,
	conversationIds: Array<string>
): void {
	state.searchIndexSlice.conversationListIndex =
		state.searchIndexSlice.conversationListIndex.filter((id) => !conversationIds.includes(id));
	conversationIds.forEach((id) => {
		delete state.populatedItemsSlice.conversations[id];
		delete state.populatedItemsSlice.conversationsStatus[id];
	});
}
function deleteMessagesInSearch(state: EmailsStoreState, messageIds: Array<string>): void {
	state.searchIndexSlice.messageListIndex = state.searchIndexSlice.messageListIndex.filter(
		(id) => !messageIds.includes(id)
	);
	messageIds.forEach((id) => {
		delete state.populatedItemsSlice.messages[id];
		delete state.populatedItemsSlice.messagesStatus[id];
		forEach(state.populatedItemsSlice.conversations, (conversation) => {
			state.populatedItemsSlice.conversations[conversation.id].messageIds = filter(
				conversation.messageIds,
				(messageId) => !messageIds.includes(messageId)
			);
		});
	});
}
function deleteMessagesFromConversation(ids: Array<string>, state: EmailsStoreState): void {
	forEach(state.populatedItemsSlice.conversations, (conversation) => {
		state.populatedItemsSlice.conversations[conversation.id].messageIds = filter(
			conversation.messageIds,
			(messageId) => !ids.includes(messageId)
		);
	});
}
function deleteMessagesInMessageIndexSlice(
	state: EmailsStoreState,
	messageIds: Array<string>
): void {
	const messageIdsSet = new Set(messageIds);
	state.messageIndexSlice.messageListIndex = state.messageIndexSlice.messageListIndex.filter(
		(id) => !messageIdsSet.has(id)
	);
}

function deleteMessagesInPopulatedItems(state: EmailsStoreState, messageIds: Array<string>): void {
	messageIds.forEach((id) => {
		delete state.populatedItemsSlice.messages[id];
	});
	deleteMessagesFromConversation(messageIds, state);
}
function deleteConversationsInConversationIndexSlice(
	state: EmailsStoreState,
	ids: Array<string>
): void {
	state.conversationIndexSlice.conversationListIndex =
		state.conversationIndexSlice.conversationListIndex.filter((id) => !ids.includes(id));
}

function deleteConversationsInPopulatedItems(state: EmailsStoreState, ids: Array<string>): void {
	ids.forEach((id) => {
		delete state.populatedItemsSlice.conversations[id];
	});
}
function handleNotifyDeleted(
	ids: Array<string>,
	useEmailsStore: UseBoundStore<StoreApi<EmailsStoreState>>
): void {
	useEmailsStore.setState(
		produce((state: EmailsStoreState) => {
			deleteConversationsInSearch(state, ids);
			deleteMessagesInSearch(state, ids);
			deleteMessagesInMessageIndexSlice(state, ids);
			deleteConversationsInConversationIndexSlice(state, ids);
			deleteMessagesInPopulatedItems(state, ids);
			deleteConversationsInPopulatedItems(state, ids);
		})
	);
}

/**
 * Updates the conversations in the application state with the modified conversation data.
 *
 * @param partialConversations - An array of normalized conversation objects containing the updates.
 * Each conversation must include an `id` and any other properties to merge with the existing state.
 *
 * @param useEmailsStore - A state management hook based on Zustand, which provides access
 * to and updates the `EmailsStoreState`. The store maintains the `populatedItemsSlice`
 * that tracks the conversation data.
 *
 * @remarks
 * - The `tags` property is explicitly replaced with the value from the `conversation` parameter.
 * - Other properties are merged into the existing data for the corresponding conversation.
 */
function handleNotifyConversationsModified(
	partialConversations: Array<NormalizedPartialConversation>,
	useEmailsStore: UseBoundStore<StoreApi<EmailsStoreState>>
): void {
	useEmailsStore.setState(
		produce(({ populatedItemsSlice }: EmailsStoreState) => {
			partialConversations.forEach((partialData) => {
				const existingConversation = populatedItemsSlice.conversations[partialData.id];
				if (existingConversation) {
					populatedItemsSlice.conversations[partialData.id] = {
						...existingConversation,
						...partialData
					};
				}
			});
		})
	);
}

/**
 * Updates the messages in the application state with modified message data.
 *
 * @param partialMessages - An array of updated message objects, each containing an `id`
 * and other properties to update in the state.
 * @param useEmailsStore - A state management hook for accessing and updating the `EmailsStoreState`.
 */
function handleNotifyMessagesModified(
	partialMessages: Array<PartialIncompleteMessage>,
	useEmailsStore: UseBoundStore<StoreApi<EmailsStoreState>>
): void {
	useEmailsStore.setState(
		produce(({ populatedItemsSlice }: EmailsStoreState) => {
			partialMessages.forEach((partialData) => {
				const existingMessage = populatedItemsSlice.messages[partialData.id];
				if (existingMessage) {
					populatedItemsSlice.messages[partialData.id] = {
						...existingMessage,
						...partialData
					};
				}
			});
		})
	);
}

/**
 * Handles the creation of notify messages by updating the application's email store state.
 *
 * This function processes incoming messages, updates the message slice, and ensures conversations
 * are updated with the new messages in the appropriate order.
 */
function handleNotifyMessagesCreated(
	messages: Array<MailMessage | IncompleteMessage>,
	useEmailsStore: UseBoundStore<StoreApi<EmailsStoreState>>
): void {
	const newMessageIds = messages.map((message) => message.id);

	function addMessagesToMessageSlice(state: EmailsStoreState): void {
		state.populatedItemsSlice.messages = messages.reduce((acc, msg) => {
			acc[msg.id] = msg;
			return acc;
		}, state.populatedItemsSlice.messages);
		state.messageIndexSlice.messageListIndex = Array.from(
			new Set([...newMessageIds, ...state.messageIndexSlice.messageListIndex])
		);
	}

	function getOrderedMessagesForConversation(
		convMessagesIds: Array<string>,
		message: IncompleteMessage
	): Array<string> {
		const sortOrder = getUserSettings()?.prefs?.zimbraPrefConversationOrder || 'dateDesc';
		if (sortOrder === 'dateDesc') {
			return Array.from(new Set([message.id, ...convMessagesIds]));
		}
		return Array.from(new Set([...convMessagesIds, message.id]));
	}

	function getOrderedConversationListIndex(
		conversations: Record<string, NormalizedConversation>,
		folderId: string
	): Array<string> {
		const sortOrder = getUserSettings()?.prefs?.zimbraPrefSortOrder as string;
		const { sortDirection } = parseMessageSortingOptions(folderId, sortOrder);
		return orderBy(conversations, 'date', toLower(sortDirection)).map((conv) => conv.id);
	}

	function addMessagesToConversation(state: EmailsStoreState): void {
		forEach(messages, (msg) => {
			const conversation = state.populatedItemsSlice.conversations?.[msg.conversation];
			if (msg?.conversation && msg?.id && msg?.parent && conversation) {
				const newMessages = find(conversation.messageIds, msg.id)
					? conversation.messageIds
					: getOrderedMessagesForConversation(conversation.messageIds, msg);

				const conv = {
					[msg.conversation]: {
						...conversation,
						messageIds: newMessages,
						fragment: msg?.fragment ?? '',
						date: msg.date
					}
				};

				state.populatedItemsSlice.conversations = {
					...state.populatedItemsSlice.conversations,
					...conv
				};

				const regex = /\/folder\/([^/]+)(?:\/|$)/;
				const match = regex.exec(globalThis.location.pathname);

				const folderId = match?.[1];
				if (folderId) {
					// Recalculate conversationListIndex when a message updates a conversation date, ordering the array according to the user's sort preference
					state.conversationIndexSlice.conversationListIndex = getOrderedConversationListIndex(
						state.populatedItemsSlice.conversations,
						folderId
					);
				}
			}
		});
	}

	useEmailsStore.setState(
		produce((state: EmailsStoreState) => {
			addMessagesToMessageSlice(state);
			addMessagesToConversation(state);
		})
	);
}

/**
 * Handles the creation of notify conversations by updating the application's email store state.
 * This function processes incoming conversations and updates the conversation slice and index
 * to include the new conversations.
 */
function handleNotifyConversationsCreated(
	conversations: Array<NormalizedConversation>,
	useEmailsStore: UseBoundStore<StoreApi<EmailsStoreState>>
): void {
	const newConversationIds = conversations.map((conv) => conv.id);
	useEmailsStore.setState(
		produce(({ populatedItemsSlice, conversationIndexSlice }: EmailsStoreState) => {
			populatedItemsSlice.conversations = conversations.reduce((acc, conversation) => {
				acc[conversation.id] = conversation;
				return acc;
			}, populatedItemsSlice.conversations);
			conversationIndexSlice.conversationListIndex = Array.from(
				new Set([...newConversationIds, ...conversationIndexSlice.conversationListIndex])
			);
		})
	);
}

export const syncDataHandlerUtils = {
	handleNotifyDeleted,
	handleNotifyMessagesModified,
	handleNotifyConversationsModified,
	handleNotifyConversationsCreated,
	handleNotifyMessagesCreated
};
