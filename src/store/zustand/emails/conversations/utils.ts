/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/* eslint-disable no-param-reassign */
import produce from 'immer';
import { forEach, some } from 'lodash';
import { StoreApi, UseBoundStore } from 'zustand';

import { CONVERSATION_INDEX_SLICE_INITIAL_STATE } from './conversations-index-slice';
import { useFolder } from '../../../../carbonio-ui-commons/store/zustand/folder';
import { API_REQUEST_STATUS } from '../../../../constants';
import { EmailsStoreState, NormalizedConversation, SearchRequestStatus } from '../../../../types';
import { POPULATED_ITEMS_SLICE_INITIAL_STATE } from '../populated-items/populated-items-slice';

function setConversations(
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

function useConversationsIdsByFolder(
	folderId: string,
	useEmailsStore: UseBoundStore<StoreApi<EmailsStoreState>>
): Array<string> {
	const folder = useFolder(folderId);
	const { populatedItemsSlice, conversationIndexSlice } = useEmailsStore();
	const folderConversationsIds: Array<string> = [];
	if (!folder) {
		return folderConversationsIds;
	}
	const { conversationListIndex: conversationsIds } = conversationIndexSlice;
	forEach(conversationsIds, (conversationId) => {
		const wantedFolder = 'rid' in folder && folder?.rid ? `${folder.zid}:${folder.rid}` : folder.id;
		if (
			some(
				populatedItemsSlice.conversations[conversationId].messages,
				(message) => message.parent === wantedFolder
			)
		) {
			folderConversationsIds.push(conversationId);
		}
	});
	return folderConversationsIds;
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
			state.populatedItemsSlice.conversations = conversations.reduce((acc, conv) => {
				acc[conv.id] = conv;
				return acc;
			}, state.populatedItemsSlice.conversations);
		})
	);
}

function prependConversationsToConversationIndexSlice(
	conversations: Array<NormalizedConversation>,
	useEmailsStore: UseBoundStore<StoreApi<EmailsStoreState>>
): void {
	const newConversationIds = conversations.map((conv) => conv.id);
	useEmailsStore.setState(
		produce((state: EmailsStoreState) => {
			state.populatedItemsSlice.conversations = conversations.reduce((acc, conversation) => {
				acc[conversation.id] = conversation;
				return acc;
			}, state.populatedItemsSlice.conversations);
			state.conversationIndexSlice.conversationListIndex = Array.from(
				new Set([...newConversationIds, ...state.conversationIndexSlice.conversationListIndex])
			);
		})
	);
}

function deleteConversationsFromConversationSlice(
	ids: Array<string>,
	useEmailsStore: UseBoundStore<StoreApi<EmailsStoreState>>
): void {
	useEmailsStore.setState(
		produce((state: EmailsStoreState) => {
			state.conversationIndexSlice.conversationListIndex =
				state.conversationIndexSlice.conversationListIndex.filter((id) => !ids.includes(id));
			ids.forEach((id) => {
				delete state.populatedItemsSlice.conversations[id];
			});
		})
	);
}

export const conversationIndexSliceUtils = {
	setConversations,
	useConversationsIdsByFolder,
	resetConversationAndPopulatedItems,
	appendConversationsToConversationIndexSlice,
	prependConversationsToConversationIndexSlice,
	updateConversationsResultsLoadingStatus,
	deleteConversationsFromConversationSlice
};
