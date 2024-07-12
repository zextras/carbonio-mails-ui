/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import produce from 'immer';
import { create } from 'zustand';

import { Conversation, MessagesStoreState } from '../../../types';

export const useMessagesStore = create<MessagesStoreState>()((set, getState) => ({
	messages: {},
	conversations: {},
	setConversations(conversations: Record<string, Conversation>): void {
		set(
			produce((state: MessagesStoreState) => {
				state.conversations = conversations;
			})
		);
	}
}));
