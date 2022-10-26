/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { isNil, some } from 'lodash';
import React, { FC, useCallback, useContext, useMemo, useState } from 'react';
import { Text, Container, SnackbarManagerContext } from '@zextras/carbonio-design-system';
import { useDispatch } from 'react-redux';
import { Folder, FOLDERS, t } from '@zextras/carbonio-shell-ui';
import { folderAction } from '../../store/actions/folder-action';
import { FolderSelector } from './commons/folder-selector';
import ModalFooter from '../../carbonio-ui-commons/components/modals/modal-footer';
import ModalHeader from '../../carbonio-ui-commons/components/modals/modal-header';
import { ModalProps } from '../../types';

export const MoveModal: FC<ModalProps> = ({ folder, onClose }) => {
	const dispatch = useDispatch();
	// eslint-disable-next-line @typescript-eslint/ban-types
	const createSnackbar = useContext(SnackbarManagerContext) as Function;
	const [folderDestination, setFolderDestination] = useState<Folder | undefined>(folder);

	const onConfirm = useCallback(() => {
		const restoreFolder = (): void =>
			dispatch(folderAction({ folder, l: folder.l, op: 'move' }))
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				.then((res) => {
					if (res.type.includes('fulfilled')) {
						createSnackbar({
							key: `move-folder`,
							replace: true,
							type: 'success',
							label: t('messages.snackbar.folder_restored', 'Folder restored'),
							autoHideTimeout: 3000,
							hideButton: true
						});
					} else {
						createSnackbar({
							key: `move`,
							replace: true,
							type: 'error',
							label: t('label.error_try_again', 'Something went wrong, please try again'),
							autoHideTimeout: 3000,
							hideButton: true
						});
					}
				});
		dispatch(
			folderAction({
				folder,
				l: folderDestination?.id || FOLDERS.USER_ROOT,
				op: 'move'
			})
		)
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			.then((res) => {
				if (res.type.includes('fulfilled')) {
					createSnackbar({
						key: `move`,
						replace: true,
						type: 'success',
						label: t('messages.snackbar.folder_moved', 'Folder successfully moved'),
						autoHideTimeout: 5000,
						hideButton: false,
						actionLabel: t('label.undo', 'Undo'),
						onActionClick: () => restoreFolder()
					});
				} else {
					createSnackbar({
						key: `move`,
						replace: true,
						type: 'error',
						label: t('label.error_try_again', 'Something went wrong, please try again.'),
						autoHideTimeout: 3000
					});
				}
				setFolderDestination(undefined);
				onClose();
			});
	}, [dispatch, folder, folderDestination?.id, createSnackbar, onClose]);

	const isInputDisabled = useMemo(
		() =>
			isNil(folderDestination) ||
			folderDestination?.id === folder?.l ||
			some(folderDestination?.children, ['name', folder?.name]),
		[folder?.l, folder?.name, folderDestination]
	);

	return folder ? (
		<Container
			padding={{ all: 'large' }}
			mainAlignment="center"
			crossAlignment="flex-start"
			height="fit"
			style={{
				overflowY: 'auto'
			}}
		>
			<ModalHeader onClose={onClose} title={`${t('label.move', 'Move')} ${folder?.name}`} />
			<Container
				padding={{ all: 'small' }}
				mainAlignment="center"
				crossAlignment="flex-start"
				height="fit"
				style={{
					overflowY: 'auto'
				}}
			>
				<Container padding={{ all: 'small' }} mainAlignment="center" crossAlignment="flex-start">
					<Text overflow="break-word">
						{t(
							'folder_panel.modal.move.body.message1',
							'Select a folder to move the considered one to:'
						)}
					</Text>
				</Container>
				<FolderSelector
					folderId={folder.id}
					folderDestination={folderDestination}
					setFolderDestination={setFolderDestination}
				/>
				<ModalFooter
					onConfirm={onConfirm}
					secondaryAction={onClose}
					label={t('label.move', 'Move')}
					secondaryLabel={t('label.cancel', 'Cancel')}
					disabled={isInputDisabled}
				/>
			</Container>
		</Container>
	) : (
		<></>
	);
};
