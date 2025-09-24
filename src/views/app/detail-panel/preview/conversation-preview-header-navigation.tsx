/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { useParams } from 'react-router-dom';

import type {
	DetailPanelConversationRouteParams,
	DetailPanelRoutesParams
} from '../../../../types/routes';
import { usePreviewHeaderNavigation } from 'hooks/use-preview-header-navigation';
import { useConversationIndexSlice } from 'store/emails/store';
import { NavigationIconButton } from 'views/app/detail-panel/preview/parts/navigation-icon-button';

export const ConversationPreviewHeaderNavigation = (): React.JSX.Element => {
	const { folderId, conversationId } =
		useParams<DetailPanelRoutesParams>() as DetailPanelConversationRouteParams;
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
