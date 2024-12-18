/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { StateCreator } from 'zustand';

import {
	MessagesIndexSliceState,
	PopulatedItemsSliceState,
	SearchIndexSliceState
} from '../../../../types';

export const SEARCH_INDEX_SLICE_INITIAL_STATE: SearchIndexSliceState['searchIndexSlice'] = {
	conversationIds: new Set<string>(),
	messageIds: new Set<string>(),
	more: false,
	offset: 0,
	status: null
};
export const createSearchIndexSlice: StateCreator<
	SearchIndexSliceState & PopulatedItemsSliceState & MessagesIndexSliceState,
	[],
	[],
	SearchIndexSliceState
> = () => ({
	searchIndexSlice: SEARCH_INDEX_SLICE_INITIAL_STATE
});
