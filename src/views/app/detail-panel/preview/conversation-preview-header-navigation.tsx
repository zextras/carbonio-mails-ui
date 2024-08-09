/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { useParams } from 'react-router-dom';

import { NavigationIconButton } from './parts/navigation-icon-button';
import { useAppSelector } from '../../../../hooks/redux';
import { useFolderSortedConversations } from '../../../../hooks/use-folder-sorted-conversations';
import { usePreviewHeaderNavigation } from '../../../../hooks/use-preview-header-navigation';
import { selectFolderSearchStatus } from '../../../../store/conversations-slice';

export const ConversationPreviewHeaderNavigation = (): React.JSX.Element => {
	const { folderId, conversationId } = useParams<{ folderId: string; conversationId: string }>();
	const conversations = useFolderSortedConversations(folderId);
	const searchedInFolderStatus = useAppSelector(selectFolderSearchStatus(folderId));

	const { previousActionItem, nextActionItem } = usePreviewHeaderNavigation({
		items: conversations,
		folderId,
		currentItemId: conversationId,
		searchedInFolderStatus,
		itemsType: 'conversation'
	});

	return (
		<>
			<NavigationIconButton item={previousActionItem} />
			<NavigationIconButton item={nextActionItem} />
		</>
	);
};
