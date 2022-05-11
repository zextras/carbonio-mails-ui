/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, useCallback, useContext } from 'react';
import { FOLDERS, report } from '@zextras/carbonio-shell-ui';
import { Container, Text, Divider, SnackbarManagerContext } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { startsWith } from 'lodash';
import ModalFooter from './commons/modal-footer';
import { ModalHeader } from './commons/modal-header';
import { folderAction } from '../../store/actions/folder-action';
import { ModalProps } from '../../types/commons';
import { FOLDER_ACTIONS } from '../../commons/utilities';

export const DeleteModal: FC<ModalProps> = ({ folder, onClose }) => {
	const [t] = useTranslation();
	const dispatch = useDispatch();
	// eslint-disable-next-line @typescript-eslint/ban-types
	const createSnackbar = useContext(SnackbarManagerContext) as Function;
	const onConfirm = useCallback(() => {
		let inTrash = false;
		const restoreFolder = (): void =>
			dispatch(
				folderAction({ folder: folder.folder, l: folder.folder?.parent, op: FOLDER_ACTIONS.MOVE })
			)
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				.then((res) => {
					if (res.type.includes('fulfilled')) {
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

		if (startsWith(folder.folder?.absFolderPath, '/Trash')) {
			inTrash = true;
		}
		dispatch(
			folderAction({
				folder: folder.folder,
				l: FOLDERS.TRASH,
				op: inTrash ? FOLDER_ACTIONS.DELETE : FOLDER_ACTIONS.MOVE
			})
		)
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			.then((res: { type: string }) => {
				if (res.type.includes('fulfilled')) {
					createSnackbar({
						key: `trash-folder`,
						replace: true,
						type: 'info',
						label: inTrash
							? t('messages.snackbar.folder_deleted', 'Folder permanently deleted.')
							: t('messages.snackbar.folder_moved_to_trash', 'Folder moved to trash'),
						autoHideTimeout: 5000,
						hideButton: false,
						actionLabel: 'Undo',
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
	}, [folder, dispatch, onClose, createSnackbar, t]);

	return folder.folder ? (
		<Container
			padding={{ all: 'large' }}
			mainAlignment="center"
			crossAlignment="flex-start"
			height="fit"
		>
			<ModalHeader
				title={`${t('label.delete', 'Delete')} ${folder.folder?.name}`}
				onClose={onClose}
			/>
			<Container
				padding={{ all: 'small' }}
				mainAlignment="center"
				crossAlignment="flex-start"
				height="fit"
			>
				{startsWith(folder.folder?.absFolderPath, '/Trash') ? (
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
				label={t('action.ok', 'Ok')}
				color="error"
			/>
		</Container>
	) : (
		<></>
	);
};
