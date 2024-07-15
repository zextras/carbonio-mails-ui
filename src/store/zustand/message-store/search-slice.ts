/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { StateCreator } from 'zustand';

import { MessageStoreState } from './store';
import { Conversation, MessagesSliceState, SearchSliceState } from '../../../types';

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
		setSearchConvResults(conversations: Array<Conversation>): void {
			set((state: MessageStoreState) => ({
				search: {
					...state.search,
					conversationIds: new Set(conversations.map((c) => c.id))
				},
				messages: {
					...state.messages,
					conversations: conversations.reduce(
						(acc, conv) => {
							// eslint-disable-next-line no-param-reassign
							acc[conv.id] = conv;
							return acc;
						},
						{} as Record<string, Conversation>
					)
				}
			}));
		}
	}
});
