/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
/* eslint-disable no-param-reassign */

import produce from 'immer';
import { merge } from 'lodash';
import { UseBoundStore, StoreApi } from 'zustand';

import {
	MailMessage,
	IncompleteMessage,
	EmailsStoreState,
	NormalizedConversation,
	PopulatedItemsSliceState,
	SearchRequestStatus
} from '../../../../types';

function useConversationMessages(
	conversationId: string,
	useEmailsStore: UseBoundStore<StoreApi<EmailsStoreState>>
): Array<MailMessage | IncompleteMessage> {
	const messages: Array<MailMessage | IncompleteMessage> = [];
	useEmailsStore(({ populatedItems }: EmailsStoreState) =>
		populatedItems.conversations[conversationId].messages.forEach((message) => {
			if (populatedItems.messages[message.id]) messages.push(populatedItems.messages[message.id]);
		})
	);
	return messages;
}
function updateConversationsOnly(
	conversations: Array<NormalizedConversation>,
	useEmailsStore: UseBoundStore<StoreApi<EmailsStoreState>>
): void {
	useEmailsStore.setState(
		produce(({ populatedItems }: PopulatedItemsSliceState) => {
			conversations.forEach((conversation) => {
				populatedItems.conversations[conversation.id] = {
					...merge(populatedItems.conversations[conversation.id], conversation),
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
		produce(({ populatedItems }: PopulatedItemsSliceState) => {
			messages.forEach((message) => {
				populatedItems.messages[message.id] = {
					...merge(populatedItems.messages[message.id], message),
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
		produce(({ populatedItems }: PopulatedItemsSliceState) => {
			messages.forEach((message) => {
				populatedItems.messages[message.id] = message;
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
		produce(({ populatedItems }: PopulatedItemsSliceState) => {
			populatedItems.conversationsStatus[conversationId] = status;
		})
	);
}
function updateMessageStatus(
	messageId: string,
	status: SearchRequestStatus,
	useEmailsStore: UseBoundStore<StoreApi<EmailsStoreState>>
): void {
	useEmailsStore.setState(
		produce(({ populatedItems }: PopulatedItemsSliceState) => {
			populatedItems.messagesStatus[messageId] = status;
		})
	);
}
function removeMessages(
	messageIds: Array<string>,
	useEmailsStore: UseBoundStore<StoreApi<EmailsStoreState>>
): void {
	useEmailsStore.setState(
		produce(({ populatedItems }: EmailsStoreState) => {
			messageIds.forEach((messageId) => {
				delete populatedItems.messages[messageId];
			});
		})
	);
}

export const populatedItemsSliceUtils = {
	removeMessages,
	updateMessageStatus,
	updateConversationStatus,
	updateMessages,
	updateMessagesOnly,
	updateConversationsOnly,
	useConversationMessages
};
