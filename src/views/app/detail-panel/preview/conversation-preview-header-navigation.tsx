/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { useParams } from 'react-router-dom';

import { NavigationIconButton } from './parts/navigation-icon-button';
import { usePreviewHeaderNavigation } from '../../../../hooks/use-preview-header-navigation';
import { useConversationIndexSlice } from '../../../../store/zustand/emails/store';

export const ConversationPreviewHeaderNavigation = (): React.JSX.Element => {
	const { folderId, conversationId } = useParams<{ folderId: string; conversationId: string }>();
	const { conversationListIndex, more, status } = useConversationIndexSlice();

	const { previousActionItem, nextActionItem } = usePreviewHeaderNavigation({
		itemIds: conversationListIndex,
		hasMore: more,
		folderId,
		currentItemId: conversationId,
		searchedInFolderStatus: status,
		itemsType: 'conversation'
	});

	return (
		<>
			<NavigationIconButton item={previousActionItem} />
			<NavigationIconButton item={nextActionItem} />
		</>
	);
};
