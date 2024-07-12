/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { StateCreator } from 'zustand';

import { MessagesSliceState, SearchSliceState } from '../../../types';

export const createSearchSlice: StateCreator<
	SearchSliceState & MessagesSliceState,
	[],
	[],
	SearchSliceState
> = (set) => ({
	search: {
		conversationIds: new Set(),
		messageIds: new Set(),
		more: false,
		offset: 0,
		sortBy: 'dateDesc',
		query: '',
		status: null,
		parent: '',
		tagName: '',
		error: undefined,
		setState(newState: Partial<SearchSliceState>): void {
			set(newState);
		}
	}
});
