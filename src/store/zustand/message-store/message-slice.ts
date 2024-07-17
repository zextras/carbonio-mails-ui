/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { StateCreator } from 'zustand';

import { type MessageStoreState } from './store';
import { NormalizedConversation, PopulatedItemsSliceState, SearchSliceState } from '../../../types';

export const createMessageSlice: StateCreator<
	PopulatedItemsSliceState & SearchSliceState,
	[],
	[],
	PopulatedItemsSliceState
> = (set) => ({
	populatedItems: {
		messages: {},
		conversations: {}
	},
	actions: {
		updateConversations(conversations: Array<NormalizedConversation>, offset: number): void {
			set((state: MessageStoreState) => ({
				search: {
					...state.search,
					conversationIds: new Set(conversations.map((c) => c.id))
				},
				populatedItems: {
					...state.populatedItems,
					offset,
					conversations: conversations.reduce(
						(acc, conv) => {
							// eslint-disable-next-line no-param-reassign
							acc[conv.id] = conv;
							return acc;
						},
						{} as Record<string, NormalizedConversation>
					)
				}
			}));
		}
	}
});
