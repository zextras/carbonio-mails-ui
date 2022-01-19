/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Container, Icon, Row, Text } from '@zextras/carbonio-design-system';
import { ModalHeader } from './commons/modal-header';

export const ShareInfoRow = ({ icon, label, text }) => (
	<Row width="fill" mainAlignment="flex-start" padding={{ all: 'small' }}>
		<Row padding={{ right: 'small' }}>
			<Icon icon={icon} />
			<Row padding={{ right: 'small', left: 'small' }}>
				<Text weight="bold">{`${label}: `}</Text>
			</Row>
			<Row takeAvailableSpace>
				<Text overflow="breakword">{text}</Text>
			</Row>
		</Row>
	</Row>
);

export const SharesInfoModal = ({ onClose, folder }) => {
	const [t] = useTranslation();

	const text = (/r/.test(folder.perm || '') ? `${t('label.read', 'Read')}` : '')
		.concat(/w/.test(folder.perm || '') ? `, ${t('label.write', 'Write')}` : '')
		.concat(/i/.test(folder.perm || '') ? `, ${t('label.insert', 'Insert')}` : '')
		.concat(/d/.test(folder.perm || '') ? `, ${t('label.delete', 'Delete')}` : '')
		.concat(/a/.test(folder.perm || '') ? `, ${t('label.administer', 'Administer')}` : '')
		.concat(/p/.test(folder.perm || '') ? `, ${t('label.private', 'Private')}` : '')
		.concat(/f/.test(folder.perm || '') ? `, ${t('label.freebusy', 'FreeBusy')}` : '')
		.concat(/c/.test(folder.perm || '') ? `, ${t('label.create', 'Create')}` : '')
		.concat(/x/.test(folder.perm || '') ? `, ${t('label.workflow', 'WorkFlow')}` : '');
	return (
		<Container
			padding={{ bottom: 'large' }}
			mainAlignment="center"
			crossAlignment="flex-start"
			height="fit"
		>
			<ModalHeader title={`${t('label.shares_info', "Shared folder's info")} `} onClose={onClose} />
			<ShareInfoRow
				icon="InfoOutline"
				label={`${t('label.shared_item', 'Shared item')}`}
				text={folder.name}
			/>
			<ShareInfoRow
				icon="PersonOutline"
				label={`${t('label.owner', 'Owner: ')}`}
				text={folder.owner}
			/>
			<ShareInfoRow
				icon="MailModOutline"
				label={`${t('label.type', 'Type')}`}
				text={t('label.mail_folder', 'E-mail folder')}
			/>
			<ShareInfoRow
				icon="UnlockOutline"
				label={`${t('label.allowed_actions', 'Allowed actions')}`}
				text={text}
			/>
			<ShareInfoRow
				icon="EmailOutline"
				label={`${t('label.messages', 'Messages')}`}
				text={folder.n}
			/>
		</Container>
	);
};
