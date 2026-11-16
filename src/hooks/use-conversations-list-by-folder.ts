/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useMemo } from 'react';

import { useFolderListSearch } from 'hooks/use-folder-list-search';
import {
	getConversationListIndex,
	updateConversationsResultsLoadingStatus,
	useConversationIndexSlice,
	useConversationsIdsByFolder
} from 'store/emails/store';
import { ConversationIndexSliceState } from 'types/search';

/**
 * Manages the state and logic for retrieving and maintaining a list of conversation indices
 * for a specific folder. Fetches conversations via `searchSoapApi` on folder change and on mailbox refresh.
 */
export const useConversationListByFolder = (folderId: string): ConversationIndexSliceState => {
	const conversationIndexSlice = useConversationIndexSlice();
	const conversationListIndexByFolder = useConversationsIdsByFolder(folderId);

	useFolderListSearch({
		folderId,
		types: 'conversation',
		updateLoadingStatus: updateConversationsResultsLoadingStatus,
		getListIndex: getConversationListIndex,
		shownListLength: conversationListIndexByFolder.length
	});

	return useMemo(
		() => ({
			conversationIndexSlice: {
				...conversationIndexSlice,
				conversationListIndex: conversationListIndexByFolder
			}
		}),
		[conversationIndexSlice, conversationListIndexByFolder]
	);
};
