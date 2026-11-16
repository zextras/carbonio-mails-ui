/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/* eslint-disable no-param-reassign */
import { useFolder } from '@zextras/carbonio-ui-commons';
import produce from 'immer';
import { filter } from 'lodash';
import { StoreApi, UseBoundStore } from 'zustand';

import { API_REQUEST_STATUS } from 'constants/index';
import { CONVERSATION_INDEX_SLICE_INITIAL_STATE } from 'store/emails/slices/conversations/conversations-index-slice';
import { getRefreshedListIndex, mergeListMessages } from 'store/emails/slices/messages/utils';
import { POPULATED_ITEMS_SLICE_INITIAL_STATE } from 'store/emails/slices/populated-items/populated-items-slice';
import { NormalizedConversation } from 'types/conversations';
import { IncompleteMessage, MailMessage } from 'types/messages';
import { EmailsStoreState, SearchRequestStatus } from 'types/search';

function setConversationsInEmailStore(
	conversations: Array<NormalizedConversation>,
	more: boolean,
	useEmailsStore: UseBoundStore<StoreApi<EmailsStoreState>>
): void {
	useEmailsStore.setState(
		produce((store: EmailsStoreState) => {
			store.conversationIndexSlice.conversationListIndex = conversations.map((conv) => conv.id);
			store.conversationIndexSlice.status = API_REQUEST_STATUS.fulfilled;
			store.conversationIndexSlice.offset = 0;
			store.conversationIndexSlice.more = more;
			store.populatedItemsSlice.conversations = conversations.reduce(
				(acc, conv) => {
					acc[conv.id] = conv;
					return acc;
				},
				{} as Record<string, NormalizedConversation>
			);
		})
	);
}

/**
 * Clears the loaded status of the loaded conversations which are not shown when the mailbox is refreshed,
 * so they are loaded again when they are shown next. The shown ones repeat their own search
 * (see useRefreshConversationOnMailboxRefresh).
 */
function clearHiddenConversationsStatus(
	shownConversationIds: Set<string>,
	useEmailsStore: UseBoundStore<StoreApi<EmailsStoreState>>
): void {
	useEmailsStore.setState(
		produce(({ populatedItemsSlice }: EmailsStoreState) => {
			Object.keys(populatedItemsSlice.conversationsStatus).forEach((conversationId) => {
				if (
					populatedItemsSlice.conversationsStatus[conversationId] ===
						API_REQUEST_STATUS.fulfilled &&
					!shownConversationIds.has(conversationId)
				) {
					delete populatedItemsSlice.conversationsStatus[conversationId];
				}
			});
		})
	);
}

function refreshConversationsInEmailStore(
	conversations: Array<NormalizedConversation>,
	messages: Array<MailMessage | IncompleteMessage>,
	more: boolean,
	searchedListIndex: Array<string>,
	useEmailsStore: UseBoundStore<StoreApi<EmailsStoreState>>
): void {
	useEmailsStore.setState(
		produce(({ conversationIndexSlice, populatedItemsSlice }: EmailsStoreState) => {
			const refreshedIndex = getRefreshedListIndex(
				conversationIndexSlice.conversationListIndex,
				conversations.map((conv) => conv.id),
				searchedListIndex
			);
			conversationIndexSlice.conversationListIndex = refreshedIndex.listIndex;
			conversationIndexSlice.status = API_REQUEST_STATUS.fulfilled;
			conversationIndexSlice.offset = 0;
			conversationIndexSlice.more = refreshedIndex.keepsLaterPages
				? conversationIndexSlice.more
				: more;

			conversations.forEach((conversation) => {
				const existingConversation = populatedItemsSlice.conversations[conversation.id];
				// a conversation still loaded was shown when the mailbox was refreshed, and its own search is
				// repeated, or it was loaded after: its messages come from that search, whatever arrives first
				const isLoaded =
					populatedItemsSlice.conversationsStatus[conversation.id] === API_REQUEST_STATUS.fulfilled;
				populatedItemsSlice.conversations[conversation.id] =
					existingConversation && isLoaded
						? { ...conversation, messageIds: existingConversation.messageIds }
						: conversation;
			});
			mergeListMessages(populatedItemsSlice.messages, messages);
		})
	);
}

function useConversationsIdsByFolder(
	folderId: string,
	useEmailsStore: UseBoundStore<StoreApi<EmailsStoreState>>
): Array<string> {
	const folder = useFolder(folderId);
	const { populatedItemsSlice, conversationIndexSlice } = useEmailsStore();
	if (!folder) {
		return [];
	}
	const { conversationListIndex: conversationsIds } = conversationIndexSlice;
	const wantedFolder = 'rid' in folder && folder?.rid ? `${folder.zid}:${folder.rid}` : folder.id;

	return conversationsIds.filter((conversationId) => {
		const messageIds = populatedItemsSlice.conversations[conversationId]?.messageIds || [];
		const messages = filter(populatedItemsSlice.messages, (message) =>
			messageIds.includes(message.id)
		);
		return messages.some((message) => message.parent === wantedFolder);
	});
}

function updateConversationsResultsLoadingStatus(
	status: SearchRequestStatus,
	useEmailsStore: UseBoundStore<StoreApi<EmailsStoreState>>
): void {
	useEmailsStore.setState(
		produce((state: EmailsStoreState) => {
			state.conversationIndexSlice.status = status;
		})
	);
}

function resetConversationAndPopulatedItems(
	useEmailsStore: UseBoundStore<StoreApi<EmailsStoreState>>
): void {
	useEmailsStore.setState(
		produce((state: EmailsStoreState) => {
			state.conversationIndexSlice = CONVERSATION_INDEX_SLICE_INITIAL_STATE;
			state.populatedItemsSlice = POPULATED_ITEMS_SLICE_INITIAL_STATE;
		})
	);
}

function appendConversationsToConversationIndexSlice(
	conversations: Array<NormalizedConversation>,
	offset: number,
	more: boolean,
	useEmailsStore: UseBoundStore<StoreApi<EmailsStoreState>>
): void {
	const newConversationIds = conversations.map((conv) => conv.id);
	useEmailsStore.setState(
		produce((state: EmailsStoreState) => {
			const uniqueConversationIds = new Set(state.conversationIndexSlice.conversationListIndex);
			newConversationIds.forEach((id) => {
				uniqueConversationIds.add(id);
			});
			state.conversationIndexSlice.conversationListIndex = Array.from(uniqueConversationIds);
			state.conversationIndexSlice.offset = offset;
			state.conversationIndexSlice.more = more;
			state.populatedItemsSlice.conversations = conversations.reduce((acc, conv) => {
				acc[conv.id] = conv;
				return acc;
			}, state.populatedItemsSlice.conversations);
		})
	);
}

export const conversationIndexSliceUtils = {
	setConversationsInEmailStore,
	refreshConversationsInEmailStore,
	clearHiddenConversationsStatus,
	useConversationsIdsByFolder,
	resetConversationAndPopulatedItems,
	appendConversationsToConversationIndexSlice,
	updateConversationsResultsLoadingStatus
};
