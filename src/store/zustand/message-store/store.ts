/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import produce from 'immer';
import { merge } from 'lodash';
import { create } from 'zustand';

import {
	createMessageSlice as createPopulatedItemsSlice,
	POPULATED_ITEMS_INITIAL_STATE
} from './message-slice';
import { createSearchSlice, SEARCH_INITIAL_STATE } from './search-slice';
import { API_REQUEST_STATUS } from '../../../constants';
import {
	IncompleteMessage,
	MailMessage,
	NormalizedConversation,
	PopulatedItemsSliceState,
	SearchRequestStatus,
	SearchSliceState
} from '../../../types';

export type MessageStoreState = PopulatedItemsSliceState & SearchSliceState;

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
	return useMessageStore((state) => state.search);
}

export function useConversationMessages(
	conversationId: string
): Array<MailMessage | IncompleteMessage> {
	return useMessageStore((state: MessageStoreState) =>
		state.populatedItems.conversations[conversationId].messages.map(
			(message) => state.populatedItems.messages[message.id]
		)
	);
}

export function useConversationStatus(id: string): SearchRequestStatus {
	return useMessageStore((state) => state.populatedItems.conversationsStatus?.[id]);
}

// TODO: rename me, probably setConversations
export function updateConversations(
	conversations: Array<NormalizedConversation>,
	offset: number,
	more: boolean
): void {
	useMessageStore.setState(
		produce((state: MessageStoreState) => {
			state.search.status = API_REQUEST_STATUS.fulfilled;
			state.search.conversationIds = new Set(conversations.map((c) => c.id));
			state.search.offset = offset;
			state.search.more = !!more;
			state.populatedItems.conversations = conversations.reduce(
				(acc, conv) => {
					// eslint-disable-next-line no-param-reassign
					acc[conv.id] = conv;
					return acc;
				},
				{} as Record<string, NormalizedConversation>
			);
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

// TODO: rename me, probably setMessages
export function updateMessages(
	messages: Array<MailMessage | IncompleteMessage>,
	offset: number
): void {
	useMessageStore.setState((state: MessageStoreState) => ({
		search: {
			...state.search,
			status: API_REQUEST_STATUS.fulfilled,
			messageIds: new Set(messages.map((c) => c.id))
		},
		populatedItems: {
			...state.populatedItems,
			offset,
			messages: messages.reduce(
				(acc, msg) => {
					// eslint-disable-next-line no-param-reassign
					acc[msg.id] = msg;
					return acc;
				},
				{} as Record<string, MailMessage | IncompleteMessage>
			)
		}
	}));
}

export function updateConversationMessages(
	conversationId: string,
	messages: IncompleteMessage[]
): void {
	useMessageStore.setState(
		produce(({ populatedItems }) => {
			populatedItems.conversations[conversationId].messages = messages;
			populatedItems.conversationsStatus[conversationId] = API_REQUEST_STATUS.fulfilled;
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
		produce(({ populatedItems }) => {
			populatedItems.conversationsStatus[conversationId] = status;
		})
	);
}

export function updateSearchResultsLoadingStatus(status: SearchRequestStatus): void {
	useMessageStore.setState(
		produce(({ searches }) => {
			searches.status = status;
		})
	);
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
