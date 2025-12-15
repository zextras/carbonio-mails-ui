/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { ReactElement, useCallback, useMemo, useState } from 'react';

import { Container, Text } from '@zextras/carbonio-design-system';
import { Folder, ModalFooter, ModalHeader } from '@zextras/carbonio-ui-commons';
import { useTranslation } from 'react-i18next';

import { isRoot } from 'helpers/folders';
import { useUiUtilities } from 'hooks/use-ui-utilities';
import { msgActionEmailStoreAction } from 'store/emails/actions/msg-action-action';
import { FolderSelector } from 'views/sidebar/commons/folder-selector';

type MoveMessageProps = {
	selectedIDs: string[];
	isRestore?: boolean;
	onClose: () => void;
	folderId: string;
	onMoveComplete?: (ids: Array<string>) => void;
};

export const MoveMessage = ({
	selectedIDs,
	isRestore,
	onClose,
	folderId,
	onMoveComplete
}: MoveMessageProps): ReactElement => {
	const [t] = useTranslation();
	const { createSnackbar } = useUiUtilities();
	const [folderDestination, setFolderDestination] = useState<Folder | undefined>();

	const onCloseModal = useCallback(() => {
		setFolderDestination(undefined);
		onClose();
	}, [onClose]);

	const onConfirmMessageMove = useCallback(
		(newFolderId = '0') => {
			msgActionEmailStoreAction({
				operation: `move`,
				ids: selectedIDs,
				parent: newFolderId
			}).then((res) => {
				if (!('Fault' in res)) {
					onMoveComplete && onMoveComplete(selectedIDs);
					createSnackbar({
						key: `edit`,
						replace: true,
						severity: 'info',
						label: isRestore
							? t('messages.snackbar.email_restored', 'E-mail restored in destination folder')
							: t('messages.snackbar.message_move', 'Message successfully moved'),
						autoHideTimeout: 3000,
						hideButton: true // todo: add Go to folder action
					});
				} else {
					createSnackbar({
						key: `edit`,
						replace: true,
						severity: 'error',
						label: t('label.error_try_again', 'Something went wrong, please try again'),
						autoHideTimeout: 3000,
						hideButton: true
					});
				}
				onCloseModal();
			});
		},
		[selectedIDs, onCloseModal, onMoveComplete, createSnackbar, isRestore, t]
	);

	const isDestinationFolderSelectionInvalid = useMemo(
		() => !folderDestination || folderDestination?.id === folderId || isRoot(folderDestination?.id),
		[folderDestination, folderId]
	);

	const headerTitle = useMemo(() => {
		if (isRestore) {
			return t('label.restore', 'Restore');
		}
		return t('folder_panel.modal.move.title_modal_message', 'Move Message');
	}, [isRestore, t]);

	const footerConfirm = useMemo(
		() => () => onConfirmMessageMove(folderDestination?.id),
		[folderDestination, onConfirmMessageMove]
	);

	const footerLabel = useMemo(() => t('label.move', 'Move'), [t]);

	const modalFooterTooltip = isDestinationFolderSelectionInvalid
		? ''
		: t('label.folder_not_valid_destination', 'The selected folder is not a valid destination');

	return (
		<Container
			padding={{ all: 'large' }}
			mainAlignment="center"
			crossAlignment="flex-start"
			height="100%"
			style={{
				overflowY: 'auto'
			}}
		>
			<ModalHeader onClose={onClose} title={headerTitle} />
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
						{isRestore
							? t('folder_panel.modal.move.body.message2', 'Select a folder to restore to:')
							: t(
									'folder_panel.modal.move.body.message1',
									'Select a folder to move the considered one to:'
								)}
					</Text>
				</Container>
				<FolderSelector
					selectedFolderId={folderDestination?.id}
					onFolderSelected={setFolderDestination}
					showSharedAccounts
					allowRootSelection={false}
				/>
				<ModalFooter
					tooltip={modalFooterTooltip}
					onConfirm={footerConfirm}
					secondaryAction={onClose}
					label={footerLabel}
					secondaryLabel={t('label.cancel', 'Cancel')}
					disabled={isDestinationFolderSelectionInvalid}
				/>
			</Container>
		</Container>
	);
};
