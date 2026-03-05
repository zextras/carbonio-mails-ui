/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { StateCreator } from 'zustand';

import { SearchIndexSliceState } from 'types/search';

export const SEARCH_INDEX_SLICE_INITIAL_STATE: SearchIndexSliceState['searchIndexSlice'] = {
	conversationListIndex: [],
	messageListIndex: [],
	more: false,
	offset: 0,
	status: null
};
export const createSearchIndexSlice: StateCreator<SearchIndexSliceState> = () => ({
	searchIndexSlice: SEARCH_INDEX_SLICE_INITIAL_STATE
});
