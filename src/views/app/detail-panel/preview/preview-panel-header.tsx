/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useCallback, FC, useMemo } from 'react';
import { getBridgedFunctions, replaceHistory, t } from '@zextras/carbonio-shell-ui';
import { Container, Divider, Icon, IconButton, Row, Text } from '@zextras/carbonio-design-system';
import { Conversation, MailMessage } from '../../../../types';

const PreviewPanelHeader: FC<{
	item: Conversation | Partial<MailMessage | undefined>;
	folderId: string;
}> = ({ item, folderId }) => {
	const replaceHistoryCallback = useCallback(
		() => replaceHistory(`/folder/${folderId}`),
		[folderId]
	);

	const subject = useMemo(
		() => item?.subject || t('label.no_subject_with_tags', '<No Subject>'),
		[item?.subject]
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
				{item?.read ? (
					<Icon style={{ width: '18px' }} icon="EmailReadOutline" data-testid="EmailReadIcon" />
				) : (
					<Icon style={{ width: '18px' }} icon="EmailReadOutline" data-testid="EmailUnreadIcon" />
				)}
				<Row mainAlignment="flex-start" padding={{ left: 'large' }} takeAvailableSpace>
					<Text size="medium" data-testid="Subject" color={item?.subject ? 'text' : 'secondary'}>
						{subject}
					</Text>
				</Row>
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
