/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useCallback } from 'react';
import { report } from '@zextras/carbonio-shell-ui';
import { Container, CustomModal, Text, Divider } from '@zextras/carbonio-design-system';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
// eslint-disable-next-line import/extensions
import ModalFooter from './commons/modal-footer.tsx';
import { ModalHeader } from './commons/modal-header';
import { folderAction } from '../../store/actions/folder-action';

export const DeleteModal = ({
	currentFolder,
	openModal,
	setModal,
	dispatch,
	t,
	createSnackbar
}) => {
	const onConfirm = useCallback(() => {
		let inTrash = false;

		const restoreFolder = () =>
			dispatch(folderAction({ folder: currentFolder, l: currentFolder.parent, op: 'move' }))
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

		if (currentFolder.absParent === '3' || currentFolder.parent === '3') {
			inTrash = true;
		}
		setModal('');
		dispatch(folderAction({ folder: currentFolder, l: '3', op: inTrash ? 'delete' : 'move' }))
			.then((res) => {
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
	}, [currentFolder, dispatch, setModal, createSnackbar, t]);

	const onClose = useCallback(() => setModal(''), [setModal]);

	return currentFolder ? (
		<CustomModal open={openModal} onClose={onClose} maxHeight="90vh">
			<Container
				padding={{ all: 'large' }}
				mainAlignment="center"
				crossAlignment="flex-start"
				height="fit"
			>
				<ModalHeader
					title={`${t('label.delete', 'Delete')} ${currentFolder.label}`}
					onClose={onClose}
				/>
				<Container
					padding={{ all: 'small' }}
					mainAlignment="center"
					crossAlignment="flex-start"
					height="fit"
				>
					{currentFolder.absParent === '3' ? (
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
					t={t}
					color="error"
				/>
			</Container>
		</CustomModal>
	) : (
		<></>
	);
};
