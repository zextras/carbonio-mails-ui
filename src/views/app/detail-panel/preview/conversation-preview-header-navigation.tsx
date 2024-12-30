/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { useParams } from 'react-router-dom';

import { NavigationIconButton } from './parts/navigation-icon-button';
import { useConversationListByFolder } from '../../../../hooks/use-conversations-list-by-folder';
import { usePreviewHeaderNavigation } from '../../../../hooks/use-preview-header-navigation';

export const ConversationPreviewHeaderNavigation = (): React.JSX.Element => {
	const { folderId, conversationId } = useParams<{ folderId: string; conversationId: string }>();
	const { conversationIndexSlice } = useConversationListByFolder(folderId);

	const { previousActionItem, nextActionItem } = usePreviewHeaderNavigation({
		itemIds: conversationIndexSlice.conversationListIndex,
		hasMore: conversationIndexSlice.more,
		folderId,
		currentItemId: conversationId,
		searchedInFolderStatus: conversationIndexSlice.status,
		itemsType: 'conversation'
	});

	return (
		<>
			<NavigationIconButton item={previousActionItem} />
			<NavigationIconButton item={nextActionItem} />
		</>
	);
};
