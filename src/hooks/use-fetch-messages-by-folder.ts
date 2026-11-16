/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { useMemo } from 'react';

import { useFolderListSearch } from 'hooks/use-folder-list-search';
import {
	getMessageListIndex,
	updateMessagesResultsLoadingStatus,
	useMessageIndexSlice,
	useMessagesIdsByFolder
} from 'store/emails/store';
import { MessageIndexSliceState } from 'types/search';

export const useFetchMessagesByFolder = (folderId: string): MessageIndexSliceState => {
	const messageIndexSlice = useMessageIndexSlice();
	const messageListIndex = useMessagesIdsByFolder(folderId);

	useFolderListSearch({
		folderId,
		types: 'message',
		updateLoadingStatus: updateMessagesResultsLoadingStatus,
		getListIndex: getMessageListIndex,
		shownListLength: messageListIndex.length
	});

	return useMemo(
		() => ({
			messageIndexSlice: {
				...messageIndexSlice,
				messageListIndex
			}
		}),
		[messageIndexSlice, messageListIndex]
	);
};
