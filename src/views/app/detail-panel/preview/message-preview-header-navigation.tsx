/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { useParams } from 'react-router-dom';

import { usePreviewHeaderNavigation } from 'hooks/use-preview-header-navigation';
import { useMessageIndexSlice } from 'store/emails/store';
import { type DetailPanelRouteParams } from 'views/app/detail-panel';
import { NavigationIconButton } from 'views/app/detail-panel/preview/parts/navigation-icon-button';

export const MessagePreviewHeaderNavigation = (): React.JSX.Element => {
	const { folderId, itemId } = useParams<DetailPanelRouteParams>() as DetailPanelRouteParams;
	const { messageListIndex, more, status } = useMessageIndexSlice();

	const { previousActionItem, nextActionItem } = usePreviewHeaderNavigation({
		itemIds: messageListIndex,
		hasMore: more,
		folderId,
		currentItemId: itemId,
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
