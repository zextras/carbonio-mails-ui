/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import produce from 'immer';
import { StateCreator } from 'zustand';

import { NormalizedConversation, MessagesSliceState, SearchSliceState } from '../../../types';

export const createMessageSlice: StateCreator<
	MessagesSliceState & SearchSliceState,
	[],
	[],
	MessagesSliceState
> = (set) => ({
	populatedItems: {
		messages: {},
		conversations: {},
		setConversations(conversations: Record<string, NormalizedConversation>): void {
			set(
				produce((state: MessagesSliceState) => {
					state.populatedItems.conversations = conversations;
				})
			);
		}
	}
});
