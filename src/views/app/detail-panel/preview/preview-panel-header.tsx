/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useCallback, useMemo } from 'react';

import {
	Button,
	Container,
	Divider,
	Icon,
	Row,
	Text,
	Tooltip
} from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { MAILS_ROUTE } from 'constants/index';
import { isFocusModeMailView } from 'helpers/external-tabs';
import { useViewLayout } from 'hooks/use-view-layout';
import { MailMessage } from 'types/messages';
import { ConversationPreviewHeaderNavigation } from 'views/app/detail-panel/preview/conversation-preview-header-navigation';
import { MessagePreviewHeaderNavigation } from 'views/app/detail-panel/preview/message-preview-header-navigation';
import { LayoutComponent } from 'views/app/folder-panel/parts/layout-component';

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
	const [t] = useTranslation();
	const navigate = useNavigate();

	const isStandAlone = isFocusModeMailView();

	const replaceHistoryCallback = useCallback(
		() => navigate(`/${MAILS_ROUTE}/folder/${folderId}`, { replace: true }),
		[folderId, navigate]
	);

	const subjectLabel = useMemo(
		() => subject || t('label.no_subject_with_tags', '<No Subject>'),
		[subject, t]
	);

	const { isCurrentLayoutNoSplit } = useViewLayout();

	return (
		<>
			<Container
				data-testid="PreviewPanelHeader"
				orientation="horizontal"
				height="3rem"
				background={'gray5'}
				mainAlignment="space-between"
				crossAlignment="center"
				padding={{ left: 'large', right: 'extrasmall' }}
				style={{ minHeight: '3rem' }}
			>
				{isCurrentLayoutNoSplit && !isStandAlone && (
					<Row padding={{ right: 'large' }}>
						<PreviewHeaderNavigation itemType={itemType} />
					</Row>
				)}
				<Icon
					icon={isRead ? 'EmailReadOutline' : 'EmailOutline'}
					data-testid={isRead ? 'EmailReadIcon' : 'EmailUnreadIcon'}
					size={'medium'}
				/>
				<Row mainAlignment="flex-start" padding={{ left: 'large' }} takeAvailableSpace>
					<Tooltip label={subjectLabel}>
						<Text size="medium" data-testid="Subject" color={subject ? 'text' : 'secondary'}>
							{subjectLabel}
						</Text>
					</Tooltip>
				</Row>
				{isCurrentLayoutNoSplit && !isStandAlone && <LayoutComponent />}
				{!isStandAlone && (
					<Button
						data-testid="PreviewPanelCloseIcon"
						icon="CloseOutline"
						onClick={replaceHistoryCallback}
						size="extralarge"
						shape="regular"
						type="default"
						labelColor="text"
						backgroundColor="transparent"
					/>
				)}
			</Container>
			<Divider />
		</>
	);
};
