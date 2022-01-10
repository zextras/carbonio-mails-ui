/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useCallback, useMemo } from 'react';
import { Text, Container, CustomModal, Divider } from '@zextras/zapp-ui';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
// eslint-disable-next-line import/extensions
import ModalFooter from './commons/modal-footer.tsx';
import { folderAction } from '../../store/actions/folder-action';
import { ModalHeader } from './commons/modal-header';

export const EmptyModal = ({ currentFolder, openModal, setModal, dispatch, t, createSnackbar }) => {
	const onConfirm = useCallback(() => {
		dispatch(folderAction({ folder: currentFolder, recursive: true, op: 'empty' })).then((res) => {
			if (res.type.includes('fulfilled')) {
				createSnackbar({
					key: `trash`,
					replace: true,
					type: 'info',
					label:
						currentFolder.id === '3'
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
		setModal('');
	}, [currentFolder, dispatch, setModal, createSnackbar, t]);

	const onClose = () => setModal('');
	const title = useMemo(
		() =>
			currentFolder.id === '3'
				? `${t('label.empty', 'Empty')} ${currentFolder.label}`
				: `${t('label.wipe', 'Wipe')} ${currentFolder.label}`,
		[currentFolder.id, currentFolder.label, t]
	);
	return (
		<CustomModal open={openModal} onClose={onClose}>
			<Container
				padding={{ all: 'large' }}
				mainAlignment="center"
				crossAlignment="flex-start"
				height="fit"
			>
				<ModalHeader title={title} onClose={onClose} />
				<Container padding={{ top: 'large', bottom: 'large' }} crossAlignment="flex-start">
					{currentFolder.id === '3' ? (
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
							{
								(t('folder_panel.modal.wipe.body.message1'),
								'Do you want to wipe the selected folder?')
							}
							<br />
							{t(
								'folder_panel.modal.wipe.body.message2',
								'If you wipe it, all the related content will be deleted permanently.'
							)}
						</Text>
					)}
				</Container>
				<Divider />
				<ModalFooter
					onConfirm={onConfirm}
					secondaryAction={onClose}
					label={currentFolder.id === '3' ? t('label.empty', 'Empty') : t('label.wipe', 'Wipe')}
					t={t}
					color="error"
				/>
			</Container>
		</CustomModal>
	);
};
