/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { useAppSelector } from './redux';
import { useFolderSortedConversations } from './use-folder-sorted-conversations';
import {
	PreviewHeaderNavigationActions,
	usePreviewHeaderNavigation
} from './use-preview-header-navigation';
import { selectFolderSearchStatus } from '../store/conversations-slice';

export const useConversationPreviewHeaderNavigation = (
	folderId: string,
	conversationId: string
): PreviewHeaderNavigationActions => {
	const conversations = useFolderSortedConversations(folderId);
	const searchedInFolderStatus = useAppSelector(selectFolderSearchStatus(folderId));

	return usePreviewHeaderNavigation({
		items: conversations,
		folderId,
		currentItemId: conversationId,
		searchedInFolderStatus,
		types: 'conversation'
	});
};
