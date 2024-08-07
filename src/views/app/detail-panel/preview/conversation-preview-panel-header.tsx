/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import PreviewPanelHeader from './preview-panel-header';
import { useAppSelector } from '../../../../hooks/redux';
import { useFolderSortedConversations } from '../../../../hooks/use-folder-sorted-conversations';
import { usePreviewHeaderNavigation } from '../../../../hooks/use-preview-header-navigation';
import { selectFolderSearchStatus } from '../../../../store/conversations-slice';
import type { MailMessage } from '../../../../types';

export type ConversationPreviewPanelHeaderProps = {
	conversationId: string;
	subject?: MailMessage['subject'];
	isRead?: MailMessage['read'];
	folderId: string;
};

export const ConversationPreviewPanelHeader = ({
	conversationId,
	folderId,
	isRead,
	subject
}: ConversationPreviewPanelHeaderProps): React.JSX.Element => {
	const conversations = useFolderSortedConversations(folderId);
	const searchedInFolderStatus = useAppSelector(selectFolderSearchStatus(folderId));

	const { previousActionItem, nextActionItem } = usePreviewHeaderNavigation({
		items: conversations,
		folderId,
		currentItemId: conversationId,
		searchedInFolderStatus,
		types: 'conversation'
	});

	return (
		<PreviewPanelHeader
			previousActionItem={previousActionItem}
			nextActionItem={nextActionItem}
			subject={subject}
			isRead={isRead}
			folderId={folderId}
		/>
	);
};
