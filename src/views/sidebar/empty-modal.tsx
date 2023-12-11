/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, useCallback, useMemo } from 'react';

import { Container, Text } from '@zextras/carbonio-design-system';
import { FOLDERS, t } from '@zextras/carbonio-shell-ui';

import ModalFooter from '../../carbonio-ui-commons/components/modals/modal-footer';
import ModalHeader from '../../carbonio-ui-commons/components/modals/modal-header';
import { useUiUtilities } from '../../hooks/use-ui-utilities';
import { folderAction } from '../../store/actions/folder-action';
import type { ModalProps } from '../../types';

export const EmptyModal: FC<ModalProps> = ({ folder, onClose }) => {
	const { createSnackbar } = useUiUtilities();

	const onConfirm = useCallback(() => {
		folderAction({ folder, recursive: true, op: 'empty' }).then((res) => {
			if (!('Fault' in res)) {
				createSnackbar({
					key: `trash`,
					replace: true,
					type: 'info',
					label:
						folder.id === FOLDERS.TRASH
							? t('messages.snackbar.folder_empty', 'Trash successfully emptied')
							: t('messages.snackbar.folder_wiped', 'Folder successfully wiped'),
					autoHideTimeout: 3000,
					hideButton: true
				});
			} else {
				createSnackbar({
					key: `trash`,
					replace: true,
					type: 'error',
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
			folder.id === FOLDERS.TRASH
				? `${t('label.empty', 'Empty')} ${folder.name}`
				: `${t('label.wipe', 'Wipe')} ${folder.name}`,
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
				{folder.id === FOLDERS.TRASH ? (
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
				label={folder.id === FOLDERS.TRASH ? t('label.empty', 'Empty') : t('label.wipe', 'Wipe')}
				color="error"
			/>
		</Container>
	);
};
