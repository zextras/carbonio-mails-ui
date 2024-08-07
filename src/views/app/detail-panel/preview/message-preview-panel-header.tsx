/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import PreviewPanelHeader from './preview-panel-header';
import { useMessagePreviewHeaderNavigation } from '../../../../hooks/use-message-preview-header-navigation';
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
	const { previousActionItem, nextActionItem } = useMessagePreviewHeaderNavigation(
		folderId,
		messageId
	);

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
