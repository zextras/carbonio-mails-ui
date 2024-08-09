/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { useParams } from 'react-router-dom';

import { NavigationIconButton } from './parts/navigation-icon-button';
import { useAppSelector } from '../../../../hooks/redux';
import { useFolderSortedMessages } from '../../../../hooks/use-folder-sorted-messages';
import { usePreviewHeaderNavigation } from '../../../../hooks/use-preview-header-navigation';
import { selectFolderMsgSearchStatus } from '../../../../store/messages-slice';

export const MessagePreviewHeaderNavigation = (): React.JSX.Element => {
	const { folderId, messageId } = useParams<{ folderId: string; messageId: string }>();
	const messages = useFolderSortedMessages(folderId);
	const searchedInFolderStatus = useAppSelector(selectFolderMsgSearchStatus(folderId));

	const { previousActionItem, nextActionItem } = usePreviewHeaderNavigation({
		items: messages,
		folderId,
		currentItemId: messageId,
		searchedInFolderStatus,
		itemsType: 'message'
	});

	return (
		<>
			<NavigationIconButton item={previousActionItem} />
			<NavigationIconButton item={nextActionItem} />
		</>
	);
};
