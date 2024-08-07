/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { useAppSelector } from './redux';
import { useFolderSortedConversations } from './use-folder-sorted-conversations';
import { usePreviewHeaderNavigation } from './use-preview-header-navigation';
import { selectFolderSearchStatus } from '../store/conversations-slice';

export const useConversationPreviewHeaderNavigation = (
	folderId: string,
	conversationId: string
): {
	onGoBackTooltip: string | undefined;
	onGoForwardTooltip: string | undefined;
	onGoForwardDisabled: boolean;
	onGoBackDisabled: boolean;
	onGoForward: () => void;
	onGoBack: () => void;
} => {
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
