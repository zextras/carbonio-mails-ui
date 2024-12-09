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

export function useConversationMessagesHook(
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
export function updateConversationsOnlyHook(
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
export function updateMessagesOnlyHook(
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

export function updateMessagesHook(
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
export function updateConversationStatusHook(
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
export function updateMessageStatusHook(
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
export function removeMessagesHook(
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
