/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useReplaceHistoryCallback } from '@zextras/zapp-shell';
import { Container, Divider, Icon, IconButton, Row, Text, Tooltip } from '@zextras/zapp-ui';

function PreviewPanelHeader({ item, folderId }) {
	const [t] = useTranslation();
	const replaceHistory = useReplaceHistoryCallback();
	const replaceHistoryCallback = useCallback(
		() => replaceHistory(`/folder/${folderId}`),
		[folderId, replaceHistory]
	);
	return (
		<>
			<Container
				data-testid="PreviewPanelHeader"
				orientation="horizontal"
				height="48px"
				background="gray5"
				mainAlignment="space-between"
				crossAlignment="center"
				padding={{ left: 'large', right: 'extrasmall' }}
				style={{ minHeight: '48px' }}
			>
				{item.read ? (
					<Icon style={{ width: '18px' }} icon="EmailReadOutline" data-testid="EmailReadIcon" />
				) : (
					<Icon style={{ width: '18px' }} icon="EmailReadOutline" data-testid="EmailUnreadIcon" />
				)}
				<Row mainAlignment="flex-start" padding={{ left: 'large' }} takeAvailableSpace>
					<Text size="medium" data-testid="Subject">
						{item.subject || `(${t('label.no_subject', 'No subject')})`}
					</Text>
				</Row>
				<Tooltip label={t('board.show', 'Show board')} placement="bottom">
					<IconButton
						data-testid="PreviewPanelMinimizeIcon"
						icon="DiagonalArrowLeftDownOutline"
						onClick={() => null}
						customSize={{
							iconSize: 'large',
							paddingSize: 'small'
						}}
					/>
				</Tooltip>
				<IconButton
					data-testid="PreviewPanelExpandIcon"
					icon="ExpandOutline"
					onClick={() => null}
					customSize={{
						iconSize: 'large',
						paddingSize: 'small'
					}}
				/>
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
}

export default PreviewPanelHeader;
