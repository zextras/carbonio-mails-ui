/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { useParams } from 'react-router-dom';

import { NavigationIconButton } from './parts/navigation-icon-button';
import { usePreviewHeaderNavigation } from '../../../../hooks/use-preview-header-navigation';
import { useConversationIndexSlice } from '../../../../store/emails/store';

export const ConversationPreviewHeaderNavigation = (): React.JSX.Element => {
	// TODO check if folderId and conversationId are always defined(check all parents Routes usages)
	const { folderId, conversationId } = useParams() as {
		folderId?: string;
		conversationId?: string;
	};
	const { conversationListIndex, more, status } = useConversationIndexSlice();

	const { previousActionItem, nextActionItem } = usePreviewHeaderNavigation({
		itemIds: conversationListIndex,
		hasMore: more,
		folderId: folderId!,
		currentItemId: conversationId!,
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
