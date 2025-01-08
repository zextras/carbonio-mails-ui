/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
/* eslint-disable no-param-reassign */

import produce from 'immer';
import { filter, forEach, includes, merge } from 'lodash';
import { UseBoundStore, StoreApi } from 'zustand';

import { useFolder } from '../../../carbonio-ui-commons/store/zustand/folder';
import {
	MailMessage,
	IncompleteMessage,
	EmailsStoreState,
	NormalizedConversation,
	SearchRequestStatus
} from '../../../types';

function useConversationMessages(
	conversationId: string,
	useEmailsStore: UseBoundStore<StoreApi<EmailsStoreState>>
): Array<MailMessage | IncompleteMessage> {
	const messages: Array<MailMessage | IncompleteMessage> = [];
	useEmailsStore(({ populatedItemsSlice }: EmailsStoreState) =>
		populatedItemsSlice.conversations[conversationId].messages.forEach((message) => {
			if (populatedItemsSlice.messages[message.id])
				messages.push(populatedItemsSlice.messages[message.id]);
		})
	);
	return messages;
}

/**
 * Updates the conversations in the application state with the modified conversation data.
 *
 * @param updatedConversations - An array of normalized conversation objects containing the updates.
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
	updatedConversations: Array<NormalizedConversation>,
	useEmailsStore: UseBoundStore<StoreApi<EmailsStoreState>>
): void {
	useEmailsStore.setState(
		produce(({ populatedItemsSlice }: EmailsStoreState) => {
			updatedConversations.forEach((conversation) => {
				populatedItemsSlice.conversations[conversation.id] = {
					...merge(populatedItemsSlice.conversations[conversation.id], conversation),
					tags: conversation.tags
				};
			});
		})
	);
}

/**
 * Updates the messages in the application state with modified message data.
 *
 * @param updatedMessages - An array of updated message objects, each containing an `id`
 * and other properties to update in the state.
 * @param useEmailsStore - A state management hook for accessing and updating the `EmailsStoreState`.
 */
function handleNotifyMessagesModified(
	updatedMessages: Array<IncompleteMessage>,
	useEmailsStore: UseBoundStore<StoreApi<EmailsStoreState>>
): void {
	useEmailsStore.setState(
		produce(({ populatedItemsSlice }: EmailsStoreState) => {
			updatedMessages.forEach((message) => {
				populatedItemsSlice.messages[message.id] = {
					...merge(populatedItemsSlice.messages[message.id], message),
					tags: message.tags
				};
			});
		})
	);
}

function updateMessages(
	messages: Array<MailMessage>,
	useEmailsStore: UseBoundStore<StoreApi<EmailsStoreState>>
): void {
	useEmailsStore.setState(
		produce(({ populatedItemsSlice }: EmailsStoreState) => {
			messages.forEach((message) => {
				populatedItemsSlice.messages[message.id] = message;
			});
		})
	);
}
function updateConversationStatus(
	conversationId: string,
	status: SearchRequestStatus,
	useEmailsStore: UseBoundStore<StoreApi<EmailsStoreState>>
): void {
	useEmailsStore.setState(
		produce(({ populatedItemsSlice }: EmailsStoreState) => {
			populatedItemsSlice.conversationsStatus[conversationId] = status;
		})
	);
}
function updateMessageStatus(
	messageId: string,
	status: SearchRequestStatus,
	useEmailsStore: UseBoundStore<StoreApi<EmailsStoreState>>
): void {
	useEmailsStore.setState(
		produce(({ populatedItemsSlice }: EmailsStoreState) => {
			populatedItemsSlice.messagesStatus[messageId] = status;
		})
	);
}

function useMessagesByIds(
	ids: Array<string>,
	useEmailsStore: UseBoundStore<StoreApi<EmailsStoreState>>
): Array<IncompleteMessage | MailMessage> {
	return useEmailsStore(({ populatedItemsSlice }: EmailsStoreState) =>
		ids
			.map((id) => populatedItemsSlice.messages[id])
			.filter((message): message is IncompleteMessage | MailMessage => !!message)
	);
}
function useMessagesByFolder(
	folderId: string,
	useEmailsStore: UseBoundStore<StoreApi<EmailsStoreState>>
): Array<MailMessage | IncompleteMessage> {
	const { populatedItemsSlice, messageIndexSlice } = useEmailsStore();
	const folder = useFolder(folderId);
	if (!folder) return [];

	const { messageListIndex } = messageIndexSlice;

	const wantedFolder = 'rid' in folder && folder?.rid ? `${folder.zid}:${folder.rid}` : folder.id;

	const wantedMessageIds = messageListIndex.filter(
		(messageId) => populatedItemsSlice.messages[messageId]?.parent === wantedFolder
	);
	return wantedMessageIds
		.map((id) => populatedItemsSlice.messages[id])
		.filter((message): message is IncompleteMessage | MailMessage => !!message);
}
function useConversationsByIds(
	ids: Array<string>,
	useEmailsStore: UseBoundStore<StoreApi<EmailsStoreState>>
): Array<NormalizedConversation> {
	return useEmailsStore(({ populatedItemsSlice }: EmailsStoreState) =>
		filter(populatedItemsSlice.conversations, (conversation) => includes(ids, conversation.id))
	);
}

export function deleteMessagesFromConversation(ids: Array<string>, state: EmailsStoreState): void {
	forEach(state.populatedItemsSlice.conversations, (conversation) => {
		state.populatedItemsSlice.conversations[conversation.id].messages = filter(
			conversation.messages,
			(message) => !ids.includes(message.id)
		);
	});
}

export const populatedItemsSliceUtils = {
	updateMessageStatus,
	updateConversationStatus,
	updateMessages,
	handleNotifyMessagesModified,
	handleNotifyConversationsModified,
	useConversationMessages,
	useMessagesByIds,
	useConversationsByIds,
	deleteMessagesFromConversation,
	useMessagesByFolder
};
