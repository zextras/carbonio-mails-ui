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
import { replaceHistory, useLocalStorage } from '@zextras/carbonio-shell-ui';
import { useTranslation } from 'react-i18next';

import { useFolder } from '../../../../carbonio-ui-commons/store/zustand/folder';
import { LOCAL_STORAGE_LAYOUT, MAILS_VIEW_LAYOUTS } from '../../../../constants';
import type { MailMessage } from '../../../../types';
import type { MailsListLayout } from '../../../folder-view';
import { getFolderTranslatedName } from '../../../sidebar/utils';
import { LayoutComponent } from '../../folder-panel/parts/layout-component';

const PreviewPanelHeader: FC<{
	subject?: MailMessage['subject'];
	isRead?: MailMessage['read'];
	folderId: string;
}> = ({ subject, isRead, folderId }) => {
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
				{listLayout === MAILS_VIEW_LAYOUTS.NO_SPLIT && (
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
					icon={isRead ? 'EmailReadOutline' : 'EmailOutline'}
					data-testid={isRead ? 'EmailReadIcon' : 'EmailUnreadIcon'}
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
