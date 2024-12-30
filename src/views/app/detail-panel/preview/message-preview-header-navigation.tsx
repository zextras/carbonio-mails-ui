/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { useParams } from 'react-router-dom';

import { NavigationIconButton } from './parts/navigation-icon-button';
import { useMessageListByFolder } from '../../../../hooks/use-message-list-by-folder';
import { usePreviewHeaderNavigation } from '../../../../hooks/use-preview-header-navigation';

export const MessagePreviewHeaderNavigation = (): React.JSX.Element => {
	const { folderId, messageId } = useParams<{ folderId: string; messageId: string }>();
	const { messageIndexSlice } = useMessageListByFolder(folderId);

	const { previousActionItem, nextActionItem } = usePreviewHeaderNavigation({
		itemIds: messageIndexSlice.messageListIndex,
		hasMore: messageIndexSlice.more,
		folderId,
		currentItemId: messageId,
		searchedInFolderStatus: messageIndexSlice.status,
		itemsType: 'message'
	});

	return (
		<>
			<NavigationIconButton item={previousActionItem} />
			<NavigationIconButton item={nextActionItem} />
		</>
	);
};
