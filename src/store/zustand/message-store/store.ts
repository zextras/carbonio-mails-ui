/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { create } from 'zustand';

import { createMessageSlice as createPopulatedItemsSlice } from './message-slice';
import { createSearchSlice } from './search-slice';
import {
	NormalizedConversation,
	type PopulatedItemsSliceState,
	type SearchSliceState
} from '../../../types';

export type MessageStoreState = PopulatedItemsSliceState & SearchSliceState;

export const useMessageStore = create<MessageStoreState>()((...a) => ({
	...createSearchSlice(...a),
	...createPopulatedItemsSlice(...a)
}));

type MessageStoreActions = {
	updateConversations: (conversations: Array<NormalizedConversation>, offset: number) => void;
};
function createStoreActions(store: MessageStoreState): MessageStoreActions {
	return {
		updateConversations: store.search.setSearchConvResults
	};
}

export const useMessageStoreActions = (): MessageStoreActions =>
	useMessageStore((state) => createStoreActions(state));

export const messageStoreActions = createStoreActions(useMessageStore.getState());
