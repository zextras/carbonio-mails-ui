/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, useCallback } from 'react';

import { Container, Divider, Text } from '@zextras/carbonio-design-system';
import { report, t } from '@zextras/carbonio-shell-ui';
import { startsWith } from 'lodash';

import ModalFooter from '../../carbonio-ui-commons/components/modals/modal-footer';
import ModalHeader from '../../carbonio-ui-commons/components/modals/modal-header';
import { FOLDERS } from '../../carbonio-ui-commons/constants/folders';
import { FOLDER_ACTIONS } from '../../commons/utilities';
import { isSharedAccountFolder, isTrashed } from '../../helpers/folders';
import { useUiUtilities } from '../../hooks/use-ui-utilities';
import { folderAction } from '../../store/actions/folder-action';
import type { ModalProps } from '../../types';

export const DeleteModal: FC<ModalProps> = ({ folder, onClose }) => {
	const { createSnackbar } = useUiUtilities();

	const onConfirm = useCallback(() => {
		const inTrash = isTrashed({ folder });
		const restoreFolder = (): void => {
			folderAction({
				folder,
				l: folder.parent,
				op: FOLDER_ACTIONS.MOVE
			})
				.then((res) => {
					if (!('Fault' in res)) {
						createSnackbar({
							key: `trash-folder`,
							replace: true,
							type: 'success',
							label: t('messages.snackbar.folder_restored', 'Folder restored'),
							autoHideTimeout: 3000,
							hideButton: true
						});
					} else {
						createSnackbar({
							key: `trash`,
							replace: true,
							type: 'error',
							label: t('label.error_try_again', 'Something went wrong, please try again'),
							autoHideTimeout: 3000,
							hideButton: true
						});
					}
				})
				.catch(report);
		};

		folderAction(
			isSharedAccountFolder(folder.id) && !inTrash
				? { folder, op: FOLDER_ACTIONS.TRASH }
				: {
						folder,
						l: FOLDERS.TRASH,
						op: inTrash ? FOLDER_ACTIONS.DELETE : FOLDER_ACTIONS.MOVE
					}
		)
			.then((res) => {
				if (!('Fault' in res)) {
					createSnackbar({
						key: `trash-folder`,
						replace: true,
						type: 'info',
						label:
							inTrash || isSharedAccountFolder(folder.id)
								? t('messages.snackbar.folder_deleted', 'Folder permanently deleted.')
								: t('messages.snackbar.folder_moved_to_trash', 'Folder moved to trash'),
						autoHideTimeout: 5000,
						hideButton: inTrash || isSharedAccountFolder(folder.id),
						actionLabel: t('label.undo', 'Undo'),
						onActionClick: () => restoreFolder()
					});
				} else {
					createSnackbar({
						key: `trash`,
						replace: true,
						type: 'error',
						label: t('label.error_try_again', 'Something went wrong, please try again'),
						autoHideTimeout: 3000,
						hideButton: true
					});
				}
			})
			.catch(report);
		onClose();
	}, [createSnackbar, folder, onClose]);

	return folder ? (
		<Container
			padding={{ all: 'large' }}
			mainAlignment="center"
			crossAlignment="flex-start"
			height="fit"
		>
			<ModalHeader title={`${t('label.delete', 'Delete')} ${folder.name}`} onClose={onClose} />
			<Container
				padding={{ all: 'small' }}
				mainAlignment="center"
				crossAlignment="flex-start"
				height="fit"
			>
				{startsWith(folder.absFolderPath, '/Trash') ? (
					<>
						<Text overflow="break-word">
							{t(
								'folder_panel.modal.delete.body.message2',
								'Do you want to delete the selected folder permanently?'
							)}
						</Text>
						<Text overflow="break-word">
							{t(
								'folder_panel.modal.delete.body.message4',
								'If you delete it, all the related content will be permanently removed and the folder will no longer be recoverable.'
							)}
						</Text>
					</>
				) : (
					<>
						<Text overflow="break-word">
							{t(
								'folder_panel.modal.delete.body.message1',
								'Do you want to delete the selected folder?'
							)}
						</Text>
						<Text overflow="break-word">
							{t(
								'folder_panel.modal.delete.body.message3',
								'If you delete it, all the related content will be moved to Trash and the folder will no longer be visible.'
							)}
						</Text>
					</>
				)}
			</Container>
			<Divider />
			<ModalFooter
				onConfirm={onConfirm}
				secondaryAction={onClose}
				secondaryLabel={t('label.cancel', 'cancel')}
				label={t('action.ok', 'Ok')}
				color="error"
			/>
		</Container>
	) : (
		<></>
	);
};
