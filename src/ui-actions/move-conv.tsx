/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { ReactElement, useCallback, useMemo, useState } from 'react';

import { Container, Input, Padding, Text } from '@zextras/carbonio-design-system';
import { Folder, ModalFooter, ModalHeader } from '@zextras/carbonio-ui-commons';
import { noop, some } from 'lodash';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { createFolderSoapApi } from 'api/create-folder-soap-api';
import { MAILS_ROUTE } from 'constants/index';
import { isRoot } from 'helpers/folders';
import { useUiUtilities } from 'hooks/use-ui-utilities';
import { convActionEmailStoreAction } from 'store/emails/actions/conv-action-action';
import { FolderSelector } from 'views/sidebar/commons/folder-selector';

type MoveMessageProps = {
	selectedIDs: string[];
	isRestore?: boolean;
	onClose: () => void;
	folderId: string;
	onMoveComplete?: (conversationsIds: Array<string>) => void;
};

export const MoveConversation = ({
	selectedIDs,
	isRestore,
	onClose,
	folderId,
	onMoveComplete
}: MoveMessageProps): ReactElement => {
	const [t] = useTranslation();
	const { createSnackbar } = useUiUtilities();
	const [inputValue, setInputValue] = useState('');
	const [folderDestination, setFolderDestination] = useState<Folder | undefined>();
	const [moveConvModal, setMoveConvModal] = useState(true);
	const navigate = useNavigate();

	const onCloseModal = useCallback(() => {
		setMoveConvModal(true);
		setInputValue('');
		setFolderDestination(undefined);
		onClose();
	}, [onClose]);

	const onConfirmConvMove = useCallback(
		(id: string | undefined) => {
			convActionEmailStoreAction({
				operation: `move`,
				ids: selectedIDs,
				parent: id
			}).then((res) => {
				if (!('Fault' in res)) {
					onMoveComplete && onMoveComplete(selectedIDs);
					createSnackbar({
						key: `edit`,
						replace: true,
						severity: 'info',
						label: isRestore
							? t('messages.snackbar.email_restored', 'E-mail restored in destination folder')
							: t('messages.snackbar.conversation_move', 'Conversation successfully moved'),
						autoHideTimeout: 3000,
						actionLabel: t('action.goto_folder', 'GO TO FOLDER'),
						onActionClick: () => {
							navigate(`/${MAILS_ROUTE}/folder/${id}`, { replace: true });
						}
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
				setMoveConvModal(false);
				onCloseModal();
			});
		},
		[selectedIDs, onCloseModal, createSnackbar, isRestore, t, navigate, onMoveComplete]
	);

	const hasSameName = useMemo(
		() => some(folderDestination?.children, ['name', inputValue]),
		[folderDestination?.children, inputValue]
	);

	const isDestinationFolderSelectionInvalid = useMemo(() => {
		if (moveConvModal) {
			return (
				!folderDestination || folderDestination?.id === folderId || isRoot(folderDestination?.id)
			);
		}
		return !folderDestination || !inputValue.length || hasSameName;
	}, [folderDestination, folderId, hasSameName, inputValue?.length, moveConvModal]);

	const textLabel = useMemo(
		() =>
			hasSameName
				? t('folder_panel.modal.new.input.name_exist')
				: t('folder_panel.modal.new.input.name', 'Folder Name'),
		[hasSameName, t]
	);

	const onConfirm = useCallback(() => {
		createFolderSoapApi({
			parentFolderId: folderDestination?.parent ?? '',
			name: inputValue
		})
			.then((res) => {
				if (!('Fault' in res) && 'folder' in res) {
					onConfirmConvMove(res.folder[0].id);
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
			})
			.catch(() => noop);
		setInputValue('');
		setFolderDestination(undefined);
	}, [createSnackbar, folderDestination?.parent, inputValue, onConfirmConvMove, t]);

	const headerTitle = useMemo(() => {
		if (moveConvModal) {
			if (isRestore) {
				return t('label.restore', 'Restore');
			}
			return t('folder_panel.modal.move.title_modal_conversation', 'Move Conversation');
		}
		return t('folder_panel.modal.new.title', 'Create a new folder');
	}, [isRestore, moveConvModal, t]);

	const footerConfirm = useMemo(() => {
		if (moveConvModal) {
			return () => onConfirmConvMove(folderDestination?.id);
		}
		return onConfirm;
	}, [folderDestination, moveConvModal, onConfirm, onConfirmConvMove]);

	const footerSecondary = useMemo(
		() =>
			moveConvModal
				? onClose
				: (): void => {
						setMoveConvModal(true);
					},
		[moveConvModal, onClose]
	);

	const footerLabel = useMemo(() => {
		if (moveConvModal) {
			return t('label.move', 'Move');
		}
		return isRestore
			? t('folder_panel.modal.new.restore_create_footer', 'Create and Restore')
			: t('folder_panel.modal.new.create_footer', 'Create and Move');
	}, [isRestore, moveConvModal, t]);

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
				{!moveConvModal && (
					<>
						<Input
							label={textLabel}
							backgroundColor="gray5"
							hasError={hasSameName}
							defaultValue={inputValue}
							onChange={(e): void => {
								setInputValue(e.target.value);
							}}
						/>
						{hasSameName && (
							<Padding all="small">
								<Text size="small" color="error">
									{t('folder_panel.modal.new.name_exist_warning', 'Name already exists')}
								</Text>
							</Padding>
						)}
					</>
				)}
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
					secondaryAction={footerSecondary}
					label={footerLabel}
					secondaryLabel={moveConvModal ? t('label.cancel', 'Cancel') : t('go_back', 'Go Back')}
					disabled={isDestinationFolderSelectionInvalid}
				/>
			</Container>
		</Container>
	);
};
