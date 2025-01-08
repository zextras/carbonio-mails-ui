import produce from 'immer';
import { filter, forEach } from 'lodash';
import { StoreApi, UseBoundStore } from 'zustand';

import { EmailsStoreState } from '../../../types';

/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
function deleteConversationsInSearch(
	state: EmailsStoreState,
	conversationIds: Array<string>
): void {
	state.searchIndexSlice.conversationListIndex =
		state.searchIndexSlice.conversationListIndex.filter((id) => !conversationIds.includes(id));
	conversationIds.forEach((id) => {
		delete state.populatedItemsSlice.conversations[id];
	});
}
function deleteMessagesInSearch(state: EmailsStoreState, messageIds: Array<string>): void {
	state.searchIndexSlice.messageListIndex = state.searchIndexSlice.messageListIndex.filter(
		(id) => !messageIds.includes(id)
	);
	messageIds.forEach((id) => {
		delete state.populatedItemsSlice.messages[id];
		forEach(state.populatedItemsSlice.conversations, (conversation) => {
			state.populatedItemsSlice.conversations[conversation.id].messages = filter(
				conversation.messages,
				(message) => !messageIds.includes(message.id)
			);
		});
	});
}
export function deleteMessagesFromConversation(ids: Array<string>, state: EmailsStoreState): void {
	forEach(state.populatedItemsSlice.conversations, (conversation) => {
		state.populatedItemsSlice.conversations[conversation.id].messages = filter(
			conversation.messages,
			(message) => !ids.includes(message.id)
		);
	});
}
function deleteMessagesInMessageIndexSlice(
	state: EmailsStoreState,
	messageIds: Array<string>
): void {
	const messageIdsSet = new Set(messageIds);
	state.messageIndexSlice.messageListIndex = state.messageIndexSlice.messageListIndex.filter(
		(id) => !messageIdsSet.has(id)
	);
}

function deleteMessagesInPopulatedItems(state: EmailsStoreState, messageIds: Array<string>): void {
	messageIds.forEach((id) => {
		delete state.populatedItemsSlice.messages[id];
	});
	deleteMessagesFromConversation(messageIds, state);
}
function deleteConversationsInConversationIndexSlice(
	state: EmailsStoreState,
	ids: Array<string>
): void {
	state.conversationIndexSlice.conversationListIndex =
		state.conversationIndexSlice.conversationListIndex.filter((id) => !ids.includes(id));
}

function deleteConversationsInPopulatedItems(state: EmailsStoreState, ids: Array<string>): void {
	ids.forEach((id) => {
		delete state.populatedItemsSlice.conversations[id];
	});
}
function handleNotityDeleted(
	ids: Array<string>,
	useEmailsStore: UseBoundStore<StoreApi<EmailsStoreState>>
): void {
	useEmailsStore.setState(
		produce((state: EmailsStoreState) => {
			deleteConversationsInSearch(state, ids);
			deleteMessagesInSearch(state, ids);
			deleteMessagesInMessageIndexSlice(state, ids);
			deleteConversationsInConversationIndexSlice(state, ids);
			deleteMessagesInPopulatedItems(state, ids);
			deleteConversationsInPopulatedItems(state, ids);
		})
	);
}
export const syncDataHandlerUtils = {
	handleNotityDeleted
};
