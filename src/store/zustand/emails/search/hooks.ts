/* eslint-disable no-param-reassign */
/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import produce, { enableMapSet } from 'immer';
import { UseBoundStore, StoreApi } from 'zustand';

import { SEARCH_INITIAL_STATE } from './search-slice';
import { API_REQUEST_STATUS } from '../../../../constants';
import {
	EmailsStoreState,
	IncompleteMessage,
	MailMessage,
	NormalizedConversation
} from '../../../../types';
import { POPULATED_ITEMS_INITIAL_STATE } from '../populated-items/populated-items-slice';

export function resetSearchAndPopulatedItemsHook(
	useEmailsStore: UseBoundStore<StoreApi<EmailsStoreState>>
): void {
	useEmailsStore.setState(
		produce((state: EmailsStoreState) => {
			state.search = SEARCH_INITIAL_STATE;
			state.populatedItems = POPULATED_ITEMS_INITIAL_STATE;
		})
	);
}

export function setSearchResultsByConversationHook(
	conversations: Array<NormalizedConversation>,
	more: boolean,
	useEmailsStore: UseBoundStore<StoreApi<EmailsStoreState>>
): void {
	useEmailsStore.setState(
		produce(({ search, populatedItems }) => {
			search.conversationIds = new Set(conversations.map((c) => c.id));
			search.status = API_REQUEST_STATUS.fulfilled;
			search.messageIds = new Set();
			search.offset = 0;
			search.more = more;
			populatedItems.conversations = conversations.reduce(
				(acc, conv) => {
					acc[conv.id] = conv;
					return acc;
				},
				{} as Record<string, NormalizedConversation>
			);
		})
	);
}

export function setSearchResultsByMessageHook(
	messages: Array<MailMessage | IncompleteMessage>,
	more: boolean,
	useEmailsStore: UseBoundStore<StoreApi<EmailsStoreState>>
): void {
	useEmailsStore.setState(
		produce(({ search, populatedItems }) => {
			search.messageIds = new Set(messages.map((message) => message.id));
			search.status = API_REQUEST_STATUS.fulfilled;
			search.conversationIds = new Set();
			search.offset = 0;
			search.more = more;
			populatedItems.messages = messages.reduce(
				(acc, message) => {
					acc[message.id] = message;
					return acc;
				},
				{} as Record<string, MailMessage | IncompleteMessage>
			);
		})
	);
}
export function appendConversationsHook(
	conversations: Array<NormalizedConversation>,
	offset: number,
	more: boolean,
	useEmailsStore: UseBoundStore<StoreApi<EmailsStoreState>>
): void {
	enableMapSet();
	const newConversationsIds = new Set(conversations.map((c) => c.id));

	useEmailsStore.setState(
		produce((state: EmailsStoreState) => {
			newConversationsIds.forEach((id) => state.search.conversationIds.add(id));
			state.search.offset = offset;
			state.search.more = more;
			state.populatedItems.conversations = conversations.reduce((acc, conv) => {
				acc[conv.id] = conv;
				return acc;
			}, state.populatedItems.conversations);
		})
	);
}
