/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { useParams } from 'react-router-dom';

import { NavigationIconButton } from './parts/navigation-icon-button';
import { usePreviewHeaderNavigation } from '../../../../hooks/use-preview-header-navigation';
import { useMessagesSlice } from '../../../../store/zustand/emails/store';

export const MessagePreviewHeaderNavigation = (): React.JSX.Element => {
	const { folderId, messageId } = useParams<{ folderId: string; messageId: string }>();
	const { messageListIndex, more, status } = useMessagesSlice();

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
