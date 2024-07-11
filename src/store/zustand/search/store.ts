/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { create } from 'zustand';

import { Conversation, SearchRequestStatus, SearchStoreState } from '../../../types';

export const useSearchItemListStore = create<SearchStoreState>()((set, getState) => ({
	conversations: {},
	messages: {},
	more: false,
	offset: 0,
	sortBy: 'dateDesc',
	query: '',
	status: null,
	parent: '',
	tagName: '',
	error: undefined,

	setStatus: (status: SearchRequestStatus): void => set({ status }),
	addConversation: (conversation: Conversation): void =>
		set(({ conversations }) => ({
			...conversations,
			[conversation.id]: conversation
		})),
	getConversation(conversationId: string): Conversation {
		return getState().conversations[conversationId];
	}
}));
