/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { create } from 'zustand';

import { SearchStoreState } from '../../../types';

export const useSearchStore = create<SearchStoreState>()((set) => ({
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
	setState(newState: Partial<SearchStoreState>): void {
		set(newState);
	}
}));
