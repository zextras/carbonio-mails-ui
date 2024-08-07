/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useCallback, FC, useMemo } from 'react';

import {
	Container,
	Divider,
	Icon,
	IconButton,
	Row,
	Text,
	Tooltip
} from '@zextras/carbonio-design-system';
import { replaceHistory, useLocalStorage } from '@zextras/carbonio-shell-ui';
import { noop } from 'lodash';
import { useTranslation } from 'react-i18next';

import { LOCAL_STORAGE_LAYOUT, MAILS_VIEW_LAYOUTS } from '../../../../constants';
import type { MailMessage } from '../../../../types';
import type { MailsListLayout } from '../../../folder-view';
import { LayoutComponent } from '../../folder-panel/parts/layout-component';

const PreviewPanelHeader: FC<{
	onGoBackTooltip?: string;
	onGoForwardTooltip?: string;
	onGoBack?: () => void;
	onGoForward?: () => void;
	subject?: MailMessage['subject'];
	isRead?: MailMessage['read'];
	folderId: string;
}> = ({
	subject,
	isRead,
	folderId,
	onGoBack,
	onGoForward,
	onGoBackTooltip,
	onGoForwardTooltip
}) => {
	const [t] = useTranslation();

	const replaceHistoryCallback = useCallback(
		() => replaceHistory(`/folder/${folderId}`),
		[folderId]
	);

	const subjectLabel = useMemo(
		() => subject || t('label.no_subject_with_tags', '<No Subject>'),
		[subject, t]
	);

	const [listLayout] = useLocalStorage<MailsListLayout>(
		LOCAL_STORAGE_LAYOUT,
		MAILS_VIEW_LAYOUTS.SPLIT
	);

	const onBackTooltipLabel =
		onGoBackTooltip ?? t('tooltip.list_navigation.onGoBack', 'Go to previous email');

	const onForwardTooltipLabel =
		onGoForwardTooltip ?? t('tooltip.list_navigation.onGoForward', 'Go to next email');

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
				{listLayout === MAILS_VIEW_LAYOUTS.NO_SPLIT && (
					<Row padding={{ right: 'large' }}>
						<Tooltip label={onBackTooltipLabel}>
							<IconButton
								onClick={onGoBack ?? noop}
								customSize={{
									iconSize: 'medium',
									paddingSize: 'small'
								}}
								disabled={!onGoBack}
								icon="ArrowIosBack"
							/>
						</Tooltip>
						<Tooltip label={onForwardTooltipLabel}>
							<IconButton
								onClick={onGoForward ?? noop}
								customSize={{
									iconSize: 'medium',
									paddingSize: 'small'
								}}
								disabled={!onGoForward}
								icon="ArrowIosForward"
							/>
						</Tooltip>
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
				{listLayout === MAILS_VIEW_LAYOUTS.NO_SPLIT && <LayoutComponent />}
				<IconButton
					data-testid="PreviewPanelCloseIcon"
					icon="CloseOutline"
					onClick={replaceHistoryCallback}
					customSize={{
						iconSize: 'large',
						paddingSize: 'small'
					}}
				/>
			</Container>
			<Divider />
		</>
	);
};

export default PreviewPanelHeader;
