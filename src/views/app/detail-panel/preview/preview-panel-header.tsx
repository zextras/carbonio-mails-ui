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
	Padding,
	Row,
	Text,
	Tooltip
} from '@zextras/carbonio-design-system';
import { replaceHistory, t, useLocalStorage } from '@zextras/carbonio-shell-ui';

import { useFolder } from '../../../../carbonio-ui-commons/store/zustand/folder';
import { LOCAL_STORAGE_LAYOUT, MAILS_VIEW_LAYOUTS } from '../../../../constants';
import type { Conversation, MailMessage } from '../../../../types';
import type { MailsListLayout } from '../../../folder-view';
import { getFolderTranslatedName } from '../../../sidebar/utils';
import { LayoutComponent } from '../../folder-panel/parts/layout-component';

const PreviewPanelHeader: FC<{
	item: Conversation | (Partial<MailMessage> & Pick<MailMessage, 'id'>);
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

	const [listLayout] = useLocalStorage<MailsListLayout>(
		LOCAL_STORAGE_LAYOUT,
		MAILS_VIEW_LAYOUTS.SPLIT
	);

	const folderName = useFolder(folderId)?.name ?? '';
	const translatedName = getFolderTranslatedName({ folderId, folderName });

	const tooltipLabel = t('tooltip.backToFolder', {
		translatedName,
		defaultValue: `Go back to {{translatedName}}`
	});
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
				{listLayout === MAILS_VIEW_LAYOUTS.FULL && (
					<Padding right={'large'}>
						<Tooltip label={tooltipLabel}>
							<IconButton
								onClick={replaceHistoryCallback}
								customSize={{
									iconSize: 'medium',
									paddingSize: 'small'
								}}
								icon="ArrowBackOutline"
							/>
						</Tooltip>
					</Padding>
				)}
				<Icon
					style={{ width: '1.125rem' }}
					icon={item?.read ? 'EmailReadOutline' : 'EmailOutline'}
					data-testid={item?.read ? 'EmailReadIcon' : 'EmailUnreadIcon'}
				/>
				<Row mainAlignment="flex-start" padding={{ left: 'large' }} takeAvailableSpace>
					<Tooltip label={subject}>
						<Text size="medium" data-testid="Subject" color={item?.subject ? 'text' : 'secondary'}>
							{subject}
						</Text>
					</Tooltip>
				</Row>
				{listLayout === MAILS_VIEW_LAYOUTS.FULL && <LayoutComponent />}
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
