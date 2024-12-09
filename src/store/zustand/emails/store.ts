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
import {
	createPopulatedItemsSlice,
	POPULATED_ITEMS_INITIAL_STATE
} from './populated-items/populated-items-slice';
import { createSearchSlice, SEARCH_INITIAL_STATE } from './search/search-slice';
import { API_REQUEST_STATUS } from '../../../constants';
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

export function useConversationById(id: string): NormalizedConversation {
	return useEmailsStore((state) => state.populatedItems.conversations[id]);
}

export function resetSearch(): void {
	useEmailsStore.setState(
		produce((state: EmailsStoreState) => {
			state.search = SEARCH_INITIAL_STATE;
			state.populatedItems = POPULATED_ITEMS_INITIAL_STATE;
		})
	);
}

export function useMessageById(id: string): IncompleteMessage | MailMessage {
	return useEmailsStore((state) => state.populatedItems.messages[id]);
}

export function useSearchResults(): SearchSliceState['search'] {
	return useEmailsStore(({ search }) => search);
}

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

export function useConversationStatus(id: string): SearchRequestStatus {
	return useEmailsStore((state) => state.populatedItems.conversationsStatus?.[id]);
}

export function setSearchResultsByConversation(
	conversations: Array<NormalizedConversation>,
	more: boolean
): void {
	useEmailsStore.setState(
		produce(({ search, populatedItems }) => {
			search.conversationIds = new Set(conversations.map((c) => c.id));
			search.status = API_REQUEST_STATUS.fulfilled;
			search.messageIds = new Set();
			search.offset = 0;
			search.more = more;
			populatedItems.conversations = conversations.reduce(
				(acc, conv) => {
					acc[conv.id] = conv;
					return acc;
				},
				{} as Record<string, NormalizedConversation>
			);
		})
	);
}
export function setSearchResultsByMessage(
	messages: Array<MailMessage | IncompleteMessage>,
	more: boolean
): void {
	useEmailsStore.setState(
		produce(({ search, populatedItems }) => {
			search.messageIds = new Set(messages.map((message) => message.id));
			search.status = API_REQUEST_STATUS.fulfilled;
			search.conversationIds = new Set();
			search.offset = 0;
			search.more = more;
			populatedItems.messages = messages.reduce(
				(acc, message) => {
					acc[message.id] = message;
					return acc;
				},
				{} as Record<string, MailMessage | IncompleteMessage>
			);
		})
	);
}

export function appendConversations(
	conversations: Array<NormalizedConversation>,
	offset: number,
	more: boolean
): void {
	enableMapSet();
	const newConversationsIds = new Set(conversations.map((c) => c.id));

	useEmailsStore.setState(
		produce((state: EmailsStoreState) => {
			newConversationsIds.forEach((id) => state.search.conversationIds.add(id));
			state.search.offset = offset;
			state.search.more = more;
			state.populatedItems.conversations = conversations.reduce((acc, conv) => {
				acc[conv.id] = conv;
				return acc;
			}, state.populatedItems.conversations);
		})
	);
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
