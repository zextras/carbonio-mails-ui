/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { FC, useCallback, useMemo } from 'react';

import { Container, Text } from '@zextras/carbonio-design-system';
import { t } from '@zextras/carbonio-shell-ui';

import {
	FOLDERS,
	default as ModalFooter,
	default as ModalHeader
} from '@zextras/carbonio-ui-commons';
import { folderActionSoapApi } from '../../api/folder-action-soap-api';
import { getFolderIdParts } from '../../helpers/folders';
import { useUiUtilities } from '../../hooks/use-ui-utilities';
import type { ModalProps } from '../../types';
import { getFolderTranslatedName } from './utils';

export const EmptyModal: FC<ModalProps> = ({ folder, onClose }) => {
	const { createSnackbar } = useUiUtilities();

	const onConfirm = useCallback(() => {
		folderActionSoapApi({ folder, recursive: true, op: 'empty', type: 'emails' }).then((res) => {
			if (!('Fault' in res)) {
				createSnackbar({
					key: `trash`,
					replace: true,
					severity: 'info',
					label:
						getFolderIdParts(folder.id).id === FOLDERS.TRASH
							? t('messages.snackbar.folder_empty', 'Trash successfully emptied')
							: t('messages.snackbar.folder_wiped', 'Folder successfully wiped'),
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

	const title = useMemo(
		() =>
			getFolderIdParts(folder.id).id === FOLDERS.TRASH
				? `${t('label.empty', 'Empty')} ${getFolderTranslatedName({ folderName: folder.name, folderId: folder.id })}`
				: `${t('label.wipe', 'Wipe')} ${getFolderTranslatedName({ folderName: folder.name, folderId: folder.id })}`,
		[folder.id, folder.name]
	);
	return (
		<Container
			padding={{ all: 'large' }}
			mainAlignment="center"
			crossAlignment="flex-start"
			height="fit"
		>
			<ModalHeader title={title} onClose={onClose} />
			<Container padding={{ top: 'large', bottom: 'large' }} crossAlignment="flex-start">
				{getFolderIdParts(folder.id).id === FOLDERS.TRASH ? (
					<Text overflow="break-word">
						{t(
							'folder_panel.modal.empty.body.message1',
							'Do you want to empty the selected folder?'
						)}
						<br />
						{t(
							'folder_panel.modal.empty.body.message2',
							'If you empty it, all the related content will be deleted permanently.'
						)}
					</Text>
				) : (
					<Text overflow="break-word">
						{t('folder_panel.modal.wipe.body.message1', 'Do you want to wipe the selected folder?')}
						<br />
						{t(
							'folder_panel.modal.wipe.body.message2',
							'If you wipe it, all the related content will be deleted permanently.'
						)}
					</Text>
				)}
			</Container>

			<ModalFooter
				onConfirm={onConfirm}
				label={
					getFolderIdParts(folder.id).id === FOLDERS.TRASH
						? t('label.empty', 'Empty')
						: t('label.wipe', 'Wipe')
				}
				color="error"
			/>
		</Container>
	);
};
