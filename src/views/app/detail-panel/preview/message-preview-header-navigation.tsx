/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { useParams } from 'react-router-dom';

import { DetailPanelMessageRouteParams, DetailPanelRoutesParams } from '../../../../types/routes';
import { usePreviewHeaderNavigation } from 'hooks/use-preview-header-navigation';
import { useMessageIndexSlice } from 'store/emails/store';
import { NavigationIconButton } from 'views/app/detail-panel/preview/parts/navigation-icon-button';

export const MessagePreviewHeaderNavigation = (): React.JSX.Element => {
	const { folderId, messageId } =
		useParams<DetailPanelRoutesParams>() as DetailPanelMessageRouteParams;
	const { messageListIndex, more, status } = useMessageIndexSlice();

	const { previousActionItem, nextActionItem } = usePreviewHeaderNavigation({
		itemIds: messageListIndex,
		hasMore: more,
		folderId,
		currentItemId: messageId,
		searchedInFolderStatus: status,
		itemsType: 'message'
	});

	return (
		<>
			<NavigationIconButton item={previousActionItem} />
			<NavigationIconButton item={nextActionItem} />
		</>
	);
};
