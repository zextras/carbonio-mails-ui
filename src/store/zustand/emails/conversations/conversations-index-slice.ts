/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { StateCreator } from 'zustand';

import { ConversationIndexSliceState, PopulatedItemsSliceState } from '../../../../types';

export const CONVERSATION_INDEX_SLICE_INITIAL_STATE: ConversationIndexSliceState['conversationIndexSlice'] =
	{
		conversationListIndex: [],
		more: false,
		offset: 0,
		status: null
	};
export const createConversationIndexSlice: StateCreator<
	PopulatedItemsSliceState & ConversationIndexSliceState,
	[],
	[],
	ConversationIndexSliceState
> = () => ({
	conversationIndexSlice: CONVERSATION_INDEX_SLICE_INITIAL_STATE
});
