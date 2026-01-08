/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useCallback } from 'react';

import { Row } from '@zextras/carbonio-design-system';
import { useNavigate } from 'react-router-dom';

import { DetailPanelHeader } from '../../../parts/detail-panel-header';
import { MAILS_ROUTE } from 'constants/index';
import { isFocusModeMailView } from 'helpers/external-tabs';
import { useViewLayout } from 'hooks/use-view-layout';
import type { MailMessage } from 'types/index.d';
import { ConversationPreviewHeaderNavigation } from 'views/app/detail-panel/preview/conversation-preview-header-navigation';
import { MessagePreviewHeaderNavigation } from 'views/app/detail-panel/preview/message-preview-header-navigation';

const PreviewHeaderNavigation = ({
	itemType
}: {
	itemType: 'message' | 'conversation';
}): React.JSX.Element => {
	if (itemType === 'message') {
		return <MessagePreviewHeaderNavigation />;
	}
	return <ConversationPreviewHeaderNavigation />;
};

type PreviewPanelHeaderProps = {
	itemType: 'message' | 'conversation';
	subject?: MailMessage['subject'];
	isRead?: MailMessage['read'];
	folderId: string;
};

export const PreviewPanelHeader = ({
	subject,
	isRead,
	folderId,
	itemType
}: PreviewPanelHeaderProps): React.JSX.Element => {
	const navigate = useNavigate();
	const isStandAlone = isFocusModeMailView();
	const navigateToFolder = useCallback(
		() => navigate(`/${MAILS_ROUTE}/folder/${folderId}`, { replace: true }),
		[folderId, navigate]
	);

	const { isCurrentLayoutNoSplit } = useViewLayout();
	const layoutView = isCurrentLayoutNoSplit && !isStandAlone;

	return (
		<DetailPanelHeader
			onClose={navigateToFolder}
			subject={subject}
			isRead={isRead}
			layoutView={layoutView}
		>
			{layoutView && (
				<Row padding={{ right: 'large' }}>
					<PreviewHeaderNavigation itemType={itemType} />
				</Row>
			)}
		</DetailPanelHeader>
	);
};
