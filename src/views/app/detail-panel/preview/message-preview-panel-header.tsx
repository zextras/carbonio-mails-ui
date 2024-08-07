/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import PreviewPanelHeader from './preview-panel-header';
import { useAppSelector } from '../../../../hooks/redux';
import { useFolderSortedMessages } from '../../../../hooks/use-folder-sorted-messages';
import { usePreviewHeaderNavigation } from '../../../../hooks/use-preview-header-navigation';
import { selectFolderMsgSearchStatus } from '../../../../store/messages-slice';
import type { MailMessage } from '../../../../types';

export type MessagePreviewPanelHeaderProps = {
	messageId: string;
	subject?: MailMessage['subject'];
	isRead?: MailMessage['read'];
	folderId: string;
};

export const MessagePreviewPanelHeader = ({
	messageId,
	subject,
	isRead,
	folderId
}: MessagePreviewPanelHeaderProps): React.JSX.Element => {
	const messages = useFolderSortedMessages(folderId);
	const searchedInFolderStatus = useAppSelector(selectFolderMsgSearchStatus(folderId));

	const { previousActionItem, nextActionItem } = usePreviewHeaderNavigation({
		items: messages,
		folderId,
		currentItemId: messageId,
		searchedInFolderStatus,
		types: 'message'
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
