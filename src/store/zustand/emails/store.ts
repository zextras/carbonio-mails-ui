/* eslint-disable no-param-reassign */
/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import produce, { enableMapSet } from 'immer';
import { merge } from 'lodash';
import { create } from 'zustand';

import { createMessageSlice } from './messages/messages-slice';
import { createPopulatedItemsSlice } from './populated-items/populated-items-slice';
import {
	appendConversationsHook,
	resetSearchAndPopulatedItemsHook,
	setSearchResultsByConversationHook,
	setSearchResultsByMessageHook
} from './search/hooks';
import { createSearchSlice } from './search/search-slice';
import {
	IncompleteMessage,
	MailMessage,
	EmailsStoreState,
	NormalizedConversation,
	PopulatedItemsSliceState,
	SearchRequestStatus,
	SearchSliceState
} from '../../../types';

const useEmailsStore = create<EmailsStoreState>()((...a) => ({
	...createSearchSlice(...a),
	...createMessageSlice(...a),
	...createPopulatedItemsSlice(...a)
}));

// Search related functions
export function resetSearchAndPopulatedItems(): void {
	resetSearchAndPopulatedItemsHook(useEmailsStore);
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

// Populated Items related functions
export function useConversationMessages(
	conversationId: string
): Array<MailMessage | IncompleteMessage> {
	const messages: Array<MailMessage | IncompleteMessage> = [];
	useEmailsStore((state: EmailsStoreState) =>
		state.populatedItems.conversations[conversationId].messages.forEach((message) => {
			if (state.populatedItems.messages[message.id])
				messages.push(state.populatedItems.messages[message.id]);
		})
	);
	return messages;
}
export function useConversationById(id: string): NormalizedConversation {
	return useEmailsStore((state) => state.populatedItems.conversations[id]);
}

export function useMessageById(id: string): IncompleteMessage | MailMessage {
	return useEmailsStore((state) => state.populatedItems.messages[id]);
}
export function useConversationStatus(id: string): SearchRequestStatus {
	return useEmailsStore((state) => state.populatedItems.conversationsStatus?.[id]);
}

export function setSearchResultsByMessage(
	messages: Array<MailMessage | IncompleteMessage>,
	more: boolean
): void {
	setSearchResultsByMessageHook(messages, more, useEmailsStore);
}

export function appendConversations(
	conversations: Array<NormalizedConversation>,
	offset: number,
	more: boolean
): void {
	appendConversationsHook(conversations, offset, more, useEmailsStore);
}

export function updateConversationsOnly(conversations: Array<NormalizedConversation>): void {
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

export function deleteConversations(ids: Array<string>): void {
	enableMapSet();
	useEmailsStore.setState(
		produce((state: EmailsStoreState) => {
			ids.forEach((id) => {
				state.search.conversationIds.delete(id);
				delete state.populatedItems.conversations[id];
			});
		})
	);
}

export function deleteMessages(ids: Array<string>): void {
	enableMapSet();
	useEmailsStore.setState(
		produce((state: EmailsStoreState) => {
			ids.forEach((id) => {
				state.search.messageIds.delete(id);
				delete state.populatedItems.messages[id];
			});
		})
	);
}

export function updateMessagesOnly(messages: Array<IncompleteMessage>): void {
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

export function setMessagesInSearchSlice(messages: Array<MailMessage | IncompleteMessage>): void {
	useEmailsStore.setState((state: EmailsStoreState) => ({
		search: {
			...state.search,
			messageIds: new Set(messages.map((c) => c.id))
		},
		populatedItems: {
			...state.populatedItems,
			offset: 0,
			messages: messages.reduce(
				(acc, msg) => {
					acc[msg.id] = msg;
					return acc;
				},
				{} as Record<string, MailMessage | IncompleteMessage>
			)
		}
	}));
}

export function setMessagesInMessagesSlice(messages: Array<MailMessage | IncompleteMessage>): void {
	useEmailsStore.setState((state: EmailsStoreState) => ({
		search: {
			...state.search,
			messageIds: new Set(messages.map((c) => c.id))
		},
		populatedItems: {
			...state.populatedItems,
			offset: 0,
			messages: messages.reduce(
				(acc, msg) => {
					acc[msg.id] = msg;
					return acc;
				},
				{} as Record<string, MailMessage | IncompleteMessage>
			)
		}
	}));
}
export function appendMessages(
	messages: Array<MailMessage | IncompleteMessage>,
	offset: number
): void {
	enableMapSet();
	const newMessageIds = new Set(messages.map((message) => message.id));
	useEmailsStore.setState(
		produce((state: EmailsStoreState) => {
			newMessageIds.forEach((messageId) => state.search.messageIds.add(messageId));
			state.search.offset = offset;
			state.populatedItems.messages = messages.reduce((acc, msg) => {
				acc[msg.id] = msg;
				return acc;
			}, state.populatedItems.messages);
		})
	);
}

export function updateMessages(messages: MailMessage[]): void {
	useEmailsStore.setState(
		produce(({ populatedItems }: PopulatedItemsSliceState) => {
			messages.forEach((message) => {
				populatedItems.messages[message.id] = message;
			});
		})
	);
}

export function updateConversationStatus(
	conversationId: string,
	status: SearchRequestStatus
): void {
	useEmailsStore.setState(
		produce(({ populatedItems }: PopulatedItemsSliceState) => {
			populatedItems.conversationsStatus[conversationId] = status;
		})
	);
}

export function updateMessageStatus(messageId: string, status: SearchRequestStatus): void {
	useEmailsStore.setState(
		produce(({ populatedItems }: PopulatedItemsSliceState) => {
			populatedItems.messagesStatus[messageId] = status;
		})
	);
}
export function useMessageStatus(id: string): SearchRequestStatus {
	return useEmailsStore((state) => state.populatedItems.messagesStatus?.[id]);
}

export function updateSearchResultsLoadingStatus(status: SearchRequestStatus): void {
	useEmailsStore.setState(
		produce(({ search }: SearchSliceState) => {
			search.status = status;
		})
	);
}

export function getSearchResultsLoadingStatus(): SearchRequestStatus {
	return useEmailsStore.getState().search.status;
}

export function removeMessages(messageIds: Array<string>): void {
	useEmailsStore.setState(
		produce((state: EmailsStoreState) => {
			messageIds.forEach((messageId) => {
				delete state.populatedItems.messages[messageId];
			});
		})
	);
}
