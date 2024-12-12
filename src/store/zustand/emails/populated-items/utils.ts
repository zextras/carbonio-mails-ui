/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
/* eslint-disable no-param-reassign */

import produce from 'immer';
import { filter, includes, merge } from 'lodash';
import { UseBoundStore, StoreApi } from 'zustand';

import {
	MailMessage,
	IncompleteMessage,
	EmailsStoreState,
	NormalizedConversation,
	SearchRequestStatus
} from '../../../../types';

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
function updateConversationsOnly(
	conversations: Array<NormalizedConversation>,
	useEmailsStore: UseBoundStore<StoreApi<EmailsStoreState>>
): void {
	useEmailsStore.setState(
		produce(({ populatedItemsSlice }: EmailsStoreState) => {
			conversations.forEach((conversation) => {
				populatedItemsSlice.conversations[conversation.id] = {
					...merge(populatedItemsSlice.conversations[conversation.id], conversation),
					tags: conversation.tags
				};
			});
		})
	);
}
function updateMessagesOnly(
	messages: Array<IncompleteMessage>,
	useEmailsStore: UseBoundStore<StoreApi<EmailsStoreState>>
): void {
	useEmailsStore.setState(
		produce(({ populatedItemsSlice }: EmailsStoreState) => {
			messages.forEach((message) => {
				populatedItemsSlice.messages[message.id] = {
					...merge(populatedItemsSlice.messages[message.id], message),
					tags: message.tags
				};
			});
		})
	);
}

function updateMessages(
	messages: MailMessage[],
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
function removeMessages(
	messageIds: Array<string>,
	useEmailsStore: UseBoundStore<StoreApi<EmailsStoreState>>
): void {
	useEmailsStore.setState(
		produce(({ populatedItemsSlice }: EmailsStoreState) => {
			messageIds.forEach((messageId) => {
				delete populatedItemsSlice.messages[messageId];
			});
		})
	);
}
function useMessagesByIds(
	ids: Array<string>,
	useEmailsStore: UseBoundStore<StoreApi<EmailsStoreState>>
): Array<IncompleteMessage | MailMessage> {
	return useEmailsStore(({ populatedItemsSlice }: EmailsStoreState) =>
		filter(populatedItemsSlice.messages, (message) => includes(ids, message.id))
	);
}

export const populatedItemsSliceUtils = {
	removeMessages,
	updateMessageStatus,
	updateConversationStatus,
	updateMessages,
	updateMessagesOnly,
	updateConversationsOnly,
	useConversationMessages,
	useMessagesByIds
};
