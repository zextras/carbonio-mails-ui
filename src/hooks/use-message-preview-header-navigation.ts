/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useAppSelector } from './redux';
import { useFolderSortedMessages } from './use-folder-sorted-messages';
import {
	PreviewHeaderNavigationActions,
	usePreviewHeaderNavigation
} from './use-preview-header-navigation';
import { selectFolderMsgSearchStatus } from '../store/messages-slice';

export const useMessagePreviewHeaderNavigation = (
	folderId: string,
	messageId: string
): PreviewHeaderNavigationActions => {
	const messages = useFolderSortedMessages(folderId);
	const searchedInFolderStatus = useAppSelector(selectFolderMsgSearchStatus(folderId));

	return usePreviewHeaderNavigation({
		items: messages,
		folderId,
		currentItemId: messageId,
		searchedInFolderStatus,
		types: 'message'
	});
};
