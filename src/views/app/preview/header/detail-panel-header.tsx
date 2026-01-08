/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useCallback } from 'react';

import { Row } from '@zextras/carbonio-design-system';
import { useNavigate } from 'react-router-dom';

import { ConversationHeaderNavigation } from './conversation-header-navigation';
import { MessageHeaderNavigation } from './message-header-navigation';
import { DetailPanelHeaderContent } from '../../../../components/preview/detail-panel-header-content';
import { MAILS_ROUTE } from '../../../../constants';
import { isFocusModeMailView } from '../../../../helpers/external-tabs';
import { useViewLayout } from '../../../../hooks/use-view-layout';
import type { MailMessage } from '../../../../types';

const DetailPanelHeaderNavigation = ({
	itemType
}: {
	itemType: 'message' | 'conversation';
}): React.JSX.Element => {
	if (itemType === 'message') {
		return <MessageHeaderNavigation />;
	}
	return <ConversationHeaderNavigation />;
};

type DetailPanelHeaderProps = {
	itemType: 'message' | 'conversation';
	subject?: MailMessage['subject'];
	isRead?: MailMessage['read'];
	folderId: string;
};

export const DetailPanelHeader = ({
	subject,
	isRead,
	folderId,
	itemType
}: DetailPanelHeaderProps): React.JSX.Element => {
	const navigate = useNavigate();
	const isStandAlone = isFocusModeMailView();
	const navigateToFolder = useCallback(
		() => navigate(`/${MAILS_ROUTE}/folder/${folderId}`, { replace: true }),
		[folderId, navigate]
	);

	const { isCurrentLayoutNoSplit } = useViewLayout();
	const layoutView = isCurrentLayoutNoSplit && !isStandAlone;

	return (
		<DetailPanelHeaderContent
			onClose={navigateToFolder}
			subject={subject}
			isRead={isRead}
			layoutView={layoutView}
		>
			{layoutView && (
				<Row padding={{ right: 'large' }}>
					<DetailPanelHeaderNavigation itemType={itemType} />
				</Row>
			)}
		</DetailPanelHeaderContent>
	);
};
