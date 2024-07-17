/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { StateCreator } from 'zustand';

import type { MessageStoreState } from './store';
import { PopulatedItemsSliceState, NormalizedConversation, SearchSliceState } from '../../../types';

export const createSearchSlice: StateCreator<
	SearchSliceState & PopulatedItemsSliceState,
	[],
	[],
	SearchSliceState
> = (set) => ({
	search: {
		conversationIds: new Set<string>(),
		messageIds: new Set<string>(),
		more: false,
		offset: 0,
		sortBy: 'dateDesc',
		query: '',
		status: null,
		parent: '',
		tagName: '',
		error: undefined
	}
});
