/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { StateCreator } from 'zustand';

import { ConversationsIndexSliceState, PopulatedItemsSliceState } from '../../../../types';

export const CONVERSATIONS_INDEX_SLICE_INITIAL_STATE: ConversationsIndexSliceState['conversationsIndexSlice'] =
	{
		conversationsIds: new Set<string>(),
		more: false,
		offset: 0,
		status: null
	};
export const createConversationsIndexSlice: StateCreator<
	PopulatedItemsSliceState & ConversationsIndexSliceState,
	[],
	[],
	ConversationsIndexSliceState
> = () => ({
	conversationsIndexSlice: CONVERSATIONS_INDEX_SLICE_INITIAL_STATE
});
