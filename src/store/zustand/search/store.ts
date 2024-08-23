/* eslint-disable no-param-reassign */
/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import produce, { enableMapSet } from 'immer';
import { merge } from 'lodash';
import { create } from 'zustand';

import { createPopulatedItemsSlice, POPULATED_ITEMS_INITIAL_STATE } from './populated-items-slice';
import { createSearchSlice, SEARCH_INITIAL_STATE } from './search-slice';
import { API_REQUEST_STATUS } from '../../../constants';
import {
	IncompleteMessage,
	MailMessage,
	MessageStoreState,
	NormalizedConversation,
	PopulatedItemsSliceState,
	SearchRequestStatus,
	SearchSliceState
} from '../../../types';

const useMessageStore = create<MessageStoreState>()((...a) => ({
	...createSearchSlice(...a),
	...createPopulatedItemsSlice(...a)
}));

export function useConversationById(id: string): NormalizedConversation {
	return useMessageStore((state) => state.populatedItems.conversations[id]);
}

export function resetSearch(): void {
	useMessageStore.setState(
		produce((state: MessageStoreState) => {
			state.search = SEARCH_INITIAL_STATE;
			state.populatedItems = POPULATED_ITEMS_INITIAL_STATE;
		})
	);
}

export function useMessageById(id: string): IncompleteMessage | MailMessage {
	return useMessageStore((state) => state.populatedItems.messages[id]);
}

export function useSearchResults(): SearchSliceState['search'] {
	return useMessageStore(({ search }) => search);
}

export function useConversationMessages(
	conversationId: string
): Array<MailMessage | IncompleteMessage> {
	const messages: Array<MailMessage | IncompleteMessage> = [];
	useMessageStore((state: MessageStoreState) =>
		state.populatedItems.conversations[conversationId].messages.forEach((message) => {
			if (state.populatedItems.messages[message.id])
				messages.push(state.populatedItems.messages[message.id]);
		})
	);
	return messages;
}

export function useConversationStatus(id: string): SearchRequestStatus {
	return useMessageStore((state) => state.populatedItems.conversationsStatus?.[id]);
}

export function setSearchResultsByConversation(
	conversations: Array<NormalizedConversation>,
	more: boolean
): void {
	useMessageStore.setState(
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
	useMessageStore.setState(
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

	useMessageStore.setState(
		produce((state: MessageStoreState) => {
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

// TODO: rename me
export function updateConversationsOnly(conversations: Array<NormalizedConversation>): void {
	useMessageStore.setState(
		produce((state: MessageStoreState) => {
			conversations.forEach((conversation) => {
				state.populatedItems.conversations[conversation.id] = merge(
					state.populatedItems.conversations[conversation.id],
					conversation
				);
			});
		})
	);
}

export function deleteConversations(ids: Array<string>): void {
	enableMapSet();
	useMessageStore.setState(
		produce((state: MessageStoreState) => {
			ids.forEach((id) => {
				state.search.conversationIds.delete(id);
				delete state.populatedItems.conversations[id];
			});
		})
	);
}

// TODO: rename me (find a better name)
export function updateMessagesOnly(messages: Array<IncompleteMessage>): void {
	useMessageStore.setState(
		produce((state: MessageStoreState) => {
			messages.forEach((message) => {
				state.populatedItems.messages[message.id] = merge(
					state.populatedItems.messages[message.id],
					message
				);
			});
		})
	);
}

export function setMessages(messages: Array<MailMessage | IncompleteMessage>): void {
	useMessageStore.setState((state: MessageStoreState) => ({
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
	useMessageStore.setState(
		produce((state: MessageStoreState) => {
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
	useMessageStore.setState(
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
	useMessageStore.setState(
		produce(({ populatedItems }: PopulatedItemsSliceState) => {
			populatedItems.conversationsStatus[conversationId] = status;
		})
	);
}

export function updateMessageStatus(messageId: string, status: SearchRequestStatus): void {
	useMessageStore.setState(
		produce(({ populatedItems }: PopulatedItemsSliceState) => {
			populatedItems.messagesStatus[messageId] = status;
		})
	);
}
export function useMessageStatus(id: string): SearchRequestStatus {
	return useMessageStore((state) => state.populatedItems.messagesStatus?.[id]);
}

export function updateSearchResultsLoadingStatus(status: SearchRequestStatus): void {
	useMessageStore.setState(
		produce(({ search }: SearchSliceState) => {
			search.status = status;
		})
	);
}

export function getSearchResultsLoadingStatus(): SearchRequestStatus {
	return useMessageStore.getState().search.status;
}

export function removeMessages(messageIds: Array<string>): void {
	useMessageStore.setState(
		produce((state: MessageStoreState) => {
			messageIds.forEach((messageId) => {
				delete state.populatedItems.messages[messageId];
			});
		})
	);
}
