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
	PopulatedItemsSliceState,
	SearchSliceState
} from '../../../types';

export type MessageStoreState = PopulatedItemsSliceState & SearchSliceState;

export const useMessageStore = create<MessageStoreState>()((...a) => ({
	...createSearchSlice(...a),
	...createPopulatedItemsSlice(...a)
}));

export function useConversationById(id: string): NormalizedConversation {
	return useMessageStore((state) => state.populatedItems.conversations[id]);
}

export function useMessageById(id: string): IncompleteMessage | MailMessage {
	return useMessageStore((state) => state.populatedItems.messages[id]);
}

export function useSearchResults(): SearchSliceState['search'] {
	return useMessageStore((state) => state.search);
}
