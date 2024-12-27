/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/* eslint-disable no-param-reassign */
import produce, { enableMapSet } from 'immer';
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
			store.conversationIndexSlice.conversationIdSet = new Set(
				conversations.map((conv) => conv.id)
			);
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
): Set<string> {
	const folder = useFolder(folderId);
	const { populatedItemsSlice, conversationIndexSlice } = useEmailsStore();
	const folderConversationsIds = new Set<string>();
	if (!folder) {
		return folderConversationsIds;
	}
	const { conversationIdSet: conversationsIds } = conversationIndexSlice;
	forEach([...conversationsIds], (conversationId) => {
		const wantedFolder = 'rid' in folder && folder?.rid ? `${folder.zid}:${folder.rid}` : folder.id;
		if (
			some(
				populatedItemsSlice.conversations[conversationId].messages,
				(message) => message.parent === wantedFolder
			)
		) {
			folderConversationsIds.add(conversationId);
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
	enableMapSet();
	const newConversationIds = new Set(conversations.map((conv) => conv.id));
	useEmailsStore.setState(
		produce((state: EmailsStoreState) => {
			newConversationIds.forEach((convId) =>
				state.conversationIndexSlice.conversationIdSet.add(convId)
			);
			state.conversationIndexSlice.offset = offset;
			state.populatedItemsSlice.conversations = conversations.reduce((acc, conv) => {
				acc[conv.id] = conv;
				return acc;
			}, state.populatedItemsSlice.conversations);
		})
	);
}

export const conversationIndexSliceUtils = {
	setConversations,
	useConversationsIdsByFolder,
	resetConversationAndPopulatedItems,
	appendConversationsToConversationIndexSlice,
	updateConversationsResultsLoadingStatus
};
