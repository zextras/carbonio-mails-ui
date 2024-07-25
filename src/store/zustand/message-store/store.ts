/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import produce from 'immer';
import { create } from 'zustand';

import { createMessageSlice as createPopulatedItemsSlice } from './message-slice';
import { createSearchSlice } from './search-slice';
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

export function useMessageById(id: string): IncompleteMessage | MailMessage {
	return useMessageStore((state) => state.populatedItems.messages[id]);
}

export function updateMessagesParent(folder: string, messageIds: Array<string>): void {
	useMessageStore.setState(
		produce((state: MessageStoreState) => {
			messageIds.forEach((msgId) => {
				state.populatedItems.messages[msgId].parent = folder;
			});
		})
	);
}

export function useSearchResults(): SearchSliceState['search'] {
	return useMessageStore((state) => state.search);
}

export function useConversationStatus(id: string): SearchRequestStatus {
	return useMessageStore((state) => state.populatedItems.conversationsStatus?.[id]);
}

export function updateConversations(
	conversations: Array<NormalizedConversation>,
	offset: number
): void {
	useMessageStore.setState((state: MessageStoreState) => ({
		search: {
			...state.search,
			status: API_REQUEST_STATUS.fulfilled,
			conversationIds: new Set(conversations.map((c) => c.id))
		},
		populatedItems: {
			...state.populatedItems,
			offset,
			conversations: conversations.reduce(
				(acc, conv) => {
					// eslint-disable-next-line no-param-reassign
					acc[conv.id] = conv;
					return acc;
				},
				{} as Record<string, NormalizedConversation>
			)
		}
	}));
}

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
			populatedItems.messages = messages.reduce(
				(acc, msg) => {
					acc[msg.id] = msg;
					return acc;
				},
				{} as Record<string, MailMessage | IncompleteMessage>
			);
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
