/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import produce from 'immer';
import { StateCreator } from 'zustand';

import { Conversation, MessagesSliceState, SearchSliceState } from '../../../types';

export const createMessageSlice: StateCreator<
	MessagesSliceState & SearchSliceState,
	[],
	[],
	MessagesSliceState
> = (set) => ({
	messages: {},
	conversations: {},
	setConversations(conversations: Record<string, Conversation>): void {
		set(
			produce((state: MessagesSliceState) => {
				state.conversations = conversations;
			})
		);
	}
});
