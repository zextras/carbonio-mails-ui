/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { create } from 'zustand';

import { createMessageSlice as createPopulatedItemsSlice } from './message-slice';
import { createSearchSlice } from './search-slice';
import {
	IncompleteMessage,
	MailMessage,
	NormalizedConversation,
	type PopulatedItemsSliceState,
	type SearchSliceState
} from '../../../types';

export type MessageStoreState = PopulatedItemsSliceState & SearchSliceState;

const useMessageStore = create<MessageStoreState>()((...a) => ({
	...createSearchSlice(...a),
	...createPopulatedItemsSlice(...a)
}));

// TODO: avoid use methods only for tests
export function getConversationById(id: string): NormalizedConversation {
	return useMessageStore.getState().populatedItems.conversations[id];
}

export function useConversationById(id: string): NormalizedConversation {
	return useMessageStore((state) => state.populatedItems.conversations[id]);
}

export function useMessageById(id: string): IncompleteMessage | MailMessage {
	return useMessageStore((state) => state.populatedItems.messages[id]);
}

export function useSearchResults(): SearchSliceState['search'] {
	return useMessageStore((state) => state.search);
}

export const messageStoreActions: PopulatedItemsSliceState['actions'] =
	useMessageStore.getState().actions;
