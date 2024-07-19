/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { StateCreator } from 'zustand';

import { type MessageStoreState } from './store';
import { API_REQUEST_STATUS } from '../../../constants';
import {
	IncompleteMessage,
	MailMessage,
	NormalizedConversation,
	PopulatedItemsSliceState,
	SearchRequestStatus,
	SearchSliceState
} from '../../../types';

export const createMessageSlice: StateCreator<
	PopulatedItemsSliceState & SearchSliceState,
	[],
	[],
	PopulatedItemsSliceState
> = (set) => ({
	populatedItems: {
		messages: {},
		conversations: {},
		conversationsStatus: {}
	},
	actions: {
		updateConversations(conversations: Array<NormalizedConversation>, offset: number): void {
			set((state: MessageStoreState) => ({
				search: {
					...state.search,
					status: API_REQUEST_STATUS.fulfilled,
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
		},
		updateMessages(messages: Array<MailMessage | IncompleteMessage>, offset: number): void {
			set((state: MessageStoreState) => ({
				search: {
					...state.search,
					status: API_REQUEST_STATUS.fulfilled,
					messageIds: new Set(messages.map((c) => c.id))
				},
				populatedItems: {
					...state.populatedItems,
					offset,
					messages: messages.reduce(
						(acc, msg) => {
							// eslint-disable-next-line no-param-reassign
							acc[msg.id] = msg;
							return acc;
						},
						{} as Record<string, MailMessage | IncompleteMessage>
					)
				}
			}));
		},
		updateConversationMessages(conversationId: string, messages: IncompleteMessage[]): void {
			set((state: MessageStoreState) => {
				state.populatedItems.conversations[conversationId].messages = messages;
				return {
					populatedItems: {
						...state.populatedItems,
						messages: messages.reduce(
							(acc, msg) => {
								// eslint-disable-next-line no-param-reassign
								acc[msg.id] = msg;
								return acc;
							},
							{} as Record<string, MailMessage | IncompleteMessage>
						)
					}
				};
			});
		},
		updateConversationStatus(conversationId: string, status: SearchRequestStatus): void {
			set((state: MessageStoreState) => {
				state.populatedItems.conversationsStatus[conversationId] = status;
				return state;
			});
		}
	}
});
