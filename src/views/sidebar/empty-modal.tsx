/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, useCallback, useMemo } from 'react';

import {
	Button,
	Container,
	Divider,
	Icon,
	Padding,
	Row,
	Text
} from '@zextras/carbonio-design-system';
import { t } from '@zextras/carbonio-shell-ui';
import { FOLDERS, isTrash, ModalFooter } from '@zextras/carbonio-ui-commons';

import { folderActionSoapApi } from 'api/folder-action-soap-api';
import { QuotaChangedEvent } from 'event-bus/events/quota-changed';
import { publishEvent } from 'event-bus/publish-event';
import { getFolderIdParts } from 'helpers/folders';
import { useUiUtilities } from 'hooks/use-ui-utilities';
import { ModalProps } from 'types/utils';
import { getFolderTranslatedName } from 'views/sidebar/utils';

export const EmptyModal: FC<ModalProps> = ({ folder, onClose }) => {
	const { createSnackbar } = useUiUtilities();

	const onConfirm = useCallback(() => {
		folderActionSoapApi({ folder, recursive: true, op: 'empty', type: 'emails' }).then((res) => {
			if (!('Fault' in res)) {
				publishEvent(new QuotaChangedEvent());
				createSnackbar({
					key: `trash`,
					replace: true,
					severity: 'info',
					label:
						getFolderIdParts(folder.id).id === FOLDERS.TRASH
							? t('messages.snackbar.folder_empty', 'Trash successfully emptied')
							: t('messages.snackbar.folder_emptied', 'Folder successfully emptied'),
					autoHideTimeout: 3000,
					hideButton: true
				});
			} else {
				createSnackbar({
					key: `trash`,
					replace: true,
					severity: 'error',
					label: t('label.error_try_again', 'Something went wrong, please try again.'),
					autoHideTimeout: 3000,
					hideButton: true
				});
			}
		});
		onClose();
	}, [createSnackbar, folder, onClose]);

	const modalTitle = useMemo(() => {
		const folderName = getFolderTranslatedName({ folderName: folder.name, folderId: folder.id });
		return `${t('label.empty', 'Empty')}: ${folderName}`;
	}, [folder.name, folder.id]);

	const confirmButtonLabel = useMemo(() => {
		const folderName = getFolderTranslatedName({ folderName: folder.name, folderId: folder.id });
		return isTrash(folder.id)
			? `${t('folder_panel.modal.empty.trash.button.yes', 'Yes, Empty')} ${folderName}`
			: t('folder_panel.modal.empty.folder.button.yes', 'Yes, Empty Folder');
	}, [folder.name, folder.id]);

	return (
		<Container mainAlignment="center" crossAlignment="flex-start" height="fit">
			<Container
				orientation="horizontal"
				mainAlignment="space-between"
				crossAlignment="center"
				padding={{ bottom: 'medium' }}
				width="fill"
			>
				<Row mainAlignment="flex-start" crossAlignment="center" takeAvailableSpace>
					<Padding right="small">
						<Icon icon="AlertCircleOutline" color="error" size="large" />
					</Padding>
					<Text weight="bold" size="large">
						{modalTitle}
					</Text>
				</Row>
				<Button type="ghost" color={'gray0'} icon="CloseOutline" onClick={onClose} size="medium" />
			</Container>
			<Divider />
			<Container padding={{ top: 'medium' }} crossAlignment="flex-start">
				<Container crossAlignment="flex-start" mainAlignment="flex-start">
					<Text overflow="break-word" size={'medium'}>
						{t(
							'folder_panel.modal.empty.body.message1',
							'Do you want to empty the selected folder?'
						)}
					</Text>
					<Padding top="medium" />
					<Text overflow="break-word" size={'medium'}>
						{t(
							'folder_panel.modal.empty.body.message2',
							'If you empty it, all the related content will be deleted permanently.'
						)}
					</Text>
					<Padding top="medium" />
					<Text weight="bold" color="error" overflow="break-word" size={'medium'}>
						{t('folder_panel.modal.empty.body.message3', 'This action cannot be undone.')}
					</Text>
				</Container>
			</Container>

			<ModalFooter
				onConfirm={onConfirm}
				label={confirmButtonLabel}
				color="error"
				secondaryAction={onClose}
				secondaryBtnType="outlined"
				secondaryLabel={t('folder_panel.modal.empty.folder.button.no', 'No, Cancel')}
			/>
		</Container>
	);
};
