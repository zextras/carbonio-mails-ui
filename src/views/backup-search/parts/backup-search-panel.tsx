/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { Container, Icon, Padding, Text } from '@zextras/carbonio-design-system';
import { t } from '@zextras/carbonio-shell-ui';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';

import { BackupSearchPanelTextLine } from './backup-search-panel-text-line';
import { getFolder } from '../../../carbonio-ui-commons/store/zustand/folder';
import { useBackupSearchStore } from '../../../store/zustand/backup-search/store';

const SearchIcon = styled(Icon)`
	width: 3.3rem;
	height: 3.3rem;
`;

export const BackupSearchPanel = (): React.JSX.Element => {
	const restoreEmailsTitle = t(
		'label.displayer_restore_emails_title',
		'Select the e-mails you want to restore'
	);
	const restoreEmailsDescription = t(
		'label.displayer_restore_emails_description',
		'Once the selected email recovery is complete, \n you will receive an email with information regarding the results.'
	);

	const { itemId } = useParams<{ itemId: string }>();
	const message = useBackupSearchStore((state) => state.messages[itemId ?? '']);
	const subject = { title: t('label.subject', 'Subject'), text: message?.subject };
	const sender = { title: t('label.from', 'From'), text: message?.sender };
	const to = { title: t('label.to', 'To'), text: message?.to };
	const dateCreated = {
		title: t('label.date_created', 'Date created'),
		text: new Date(message?.creationDate).toUTCString()
	};
	const dateDeleted = {
		title: t('label.date_deleted', 'Date deleted'),
		text: new Date(message?.deletionDate).toUTCString()
	};

	const folder = getFolder(message?.folderId);
	const folderName = { title: t('label.folder', 'Folder'), text: folder?.name };

	return itemId ? (
		<Container padding={{ left: '8rem' }} background="gray5" width={'fill'}>
			<BackupSearchPanelTextLine title={subject.title} text={subject.text} />
			<BackupSearchPanelTextLine title={sender.title} text={sender.text} />
			<BackupSearchPanelTextLine title={to.title} text={to.text} />
			<BackupSearchPanelTextLine title={dateCreated.title} text={dateCreated.text} />
			<BackupSearchPanelTextLine title={dateDeleted.title} text={dateDeleted.text} />
			<BackupSearchPanelTextLine title={folderName.title} text={folderName.text} />
		</Container>
	) : (
		<Container background="gray5">
			<SearchIcon icon="Search" color="gray1" />
			<Padding all="medium">
				<Text
					color="gray1"
					overflow="break-word"
					weight="bold"
					size="extralarge"
					style={{ whiteSpace: 'pre-line', textAlign: 'center' }}
				>
					{restoreEmailsTitle}
				</Text>
			</Padding>
			<Text
				size="small"
				color="gray1"
				overflow="break-word"
				style={{ whiteSpace: 'pre-line', textAlign: 'center' }}
			>
				{restoreEmailsDescription}
			</Text>
		</Container>
	);
};
