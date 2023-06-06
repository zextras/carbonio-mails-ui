/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { Container, Text } from '@zextras/carbonio-design-system';
import { FOLDERS, getBridgedFunctions, t } from '@zextras/carbonio-shell-ui';
import { isNil, some } from 'lodash';
import React, { FC, useCallback, useMemo, useState } from 'react';
import ModalFooter from '../../carbonio-ui-commons/components/modals/modal-footer';
import ModalHeader from '../../carbonio-ui-commons/components/modals/modal-header';
import type { Folder } from '../../carbonio-ui-commons/types/folder';
import { folderAction } from '../../store/actions/folder-action';
import type { ModalProps } from '../../types';
import { FolderSelector } from './commons/folder-selector';

export const MoveModal: FC<ModalProps> = ({ folder, onClose }) => {
	const [folderDestination, setFolderDestination] = useState<Folder | undefined>(folder);

	const onConfirm = useCallback(() => {
		const restoreFolder = (): Promise<void> =>
			folderAction({ folder, l: folder.l, op: 'move' }).then((res) => {
				if (res.type.includes('fulfilled')) {
					getBridgedFunctions()?.createSnackbar({
						key: `move-folder`,
						replace: true,
						type: 'success',
						label: t('messages.snackbar.folder_restored', 'Folder restored'),
						autoHideTimeout: 3000,
						hideButton: true
					});
				} else {
					getBridgedFunctions()?.createSnackbar({
						key: `move`,
						replace: true,
						type: 'error',
						label: t('label.error_try_again', 'Something went wrong, please try again'),
						autoHideTimeout: 3000,
						hideButton: true
					});
				}
			});
		folderAction({
			folder,
			l: folderDestination?.id || FOLDERS.USER_ROOT,
			op: 'move'
		}).then((res) => {
			if (res.type.includes('fulfilled')) {
				getBridgedFunctions()?.createSnackbar({
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
				getBridgedFunctions()?.createSnackbar({
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
	}, [folder, folderDestination?.id, onClose]);

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
