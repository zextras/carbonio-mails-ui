/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { useParams } from 'react-router-dom';

import { NavigationIconButton } from './parts/navigation-icon-button';
import { usePreviewHeaderNavigation } from '../../../../hooks/use-preview-header-navigation';
import { useMessageIndexSlice } from '../../../../store/emails/store';

export const MessagePreviewHeaderNavigation = (): React.JSX.Element => {
	// TODO check if folderId and messageId are always defined(check all parents Routes usages)
	const { folderId, messageId } = useParams() as { folderId?: string; messageId?: string };
	const { messageListIndex, more, status } = useMessageIndexSlice();

	const { previousActionItem, nextActionItem } = usePreviewHeaderNavigation({
		itemIds: messageListIndex,
		hasMore: more,
		folderId: folderId!,
		currentItemId: messageId!,
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
