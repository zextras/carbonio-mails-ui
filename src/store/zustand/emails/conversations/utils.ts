/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/* eslint-disable no-param-reassign */
import produce, { enableMapSet } from 'immer';
import { forEach, some } from 'lodash';
import { StoreApi, UseBoundStore } from 'zustand';

import { MESSAGES_INDEX_SLICE_INITIAL_STATE } from './messages-slice';
import { API_REQUEST_STATUS } from '../../../../constants';
import {
	EmailsStoreState,
	Folder,
	NormalizedConversation,
	SearchRequestStatus
} from '../../../../types';
import { POPULATED_ITEMS_SLICE_INITIAL_STATE } from '../populated-items/populated-items-slice';

function setConversations(
	conversations: Array<NormalizedConversation>,
	more: boolean,
	useEmailsStore: UseBoundStore<StoreApi<EmailsStoreState>>
): void {
	useEmailsStore.setState(
		produce((store: EmailsStoreState) => {
			store.conversationsIndexSlice.conversationsIds = new Set(
				conversations.map((conv) => conv.id)
			);
			store.conversationsIndexSlice.status = API_REQUEST_STATUS.fulfilled;
			store.conversationsIndexSlice.offset = 0;
			store.conversationsIndexSlice.more = more;

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
	folder: Folder,
	useEmailsStore: UseBoundStore<StoreApi<EmailsStoreState>>
): Set<string> {
	const folderConversationsIds = new Set<string>();
	const { populatedItemsSlice, conversationsIndexSlice } = useEmailsStore();
	const { conversationsIds } = conversationsIndexSlice;
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
			state.conversationsIndexSlice.status = status;
		})
	);
}

function resetConversationAndPopulatedItems(
	useEmailsStore: UseBoundStore<StoreApi<EmailsStoreState>>
): void {
	useEmailsStore.setState(
		produce((state: EmailsStoreState) => {
			state.conversationsIndexSlice = MESSAGES_INDEX_SLICE_INITIAL_STATE;
			state.populatedItemsSlice = POPULATED_ITEMS_SLICE_INITIAL_STATE;
		})
	);
}

function appendConversationsToConversationsIndexSlice(
	conversations: Array<NormalizedConversation>,
	offset: number,
	useEmailsStore: UseBoundStore<StoreApi<EmailsStoreState>>
): void {
	enableMapSet();
	const newConversationIds = new Set(conversations.map((conv) => conv.id));
	useEmailsStore.setState(
		produce((state: EmailsStoreState) => {
			newConversationIds.forEach((convId) =>
				state.conversationsIndexSlice.conversationsIds.add(convId)
			);
			state.conversationsIndexSlice.offset = offset;
			state.populatedItemsSlice.conversations = conversations.reduce((acc, conv) => {
				acc[conv.id] = conv;
				return acc;
			}, state.populatedItemsSlice.conversations);
		})
	);
}

export const conversationsIndexSliceUtils = {
	setConversations,
	useConversationsIdsByFolder,
	resetConversationAndPopulatedItems,
	appendConversationsToConversationsIndexSlice,
	updateConversationsResultsLoadingStatus
};
