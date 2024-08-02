/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { ReactElement, useCallback, useMemo, useState } from 'react';

import { Container, Input, Padding, Text } from '@zextras/carbonio-design-system';
import { replaceHistory, t } from '@zextras/carbonio-shell-ui';
import { noop, some } from 'lodash';

import ModalFooter from '../carbonio-ui-commons/components/modals/modal-footer';
import ModalHeader from '../carbonio-ui-commons/components/modals/modal-header';
import { Folder } from '../carbonio-ui-commons/types/folder';
import { isRoot } from '../helpers/folders';
import { useUiUtilities } from '../hooks/use-ui-utilities';
import { convAction, msgAction } from '../store/actions';
import { createFolder } from '../store/actions/create-folder';
import { AppDispatch } from '../store/redux';
import { FolderSelector } from '../views/sidebar/commons/folder-selector';

type MoveConvMessageProps = {
	selectedIDs: string[];
	isMessageView: boolean;
	isRestore?: boolean;
	deselectAll?: () => void;
	onClose: () => void;
	folderId: string;
	dispatch: AppDispatch;
};

const MoveConvMessage = ({
	selectedIDs,
	isMessageView,
	isRestore,
	deselectAll,
	onClose,
	folderId,
	dispatch
}: MoveConvMessageProps): ReactElement => {
	const { createSnackbar } = useUiUtilities();
	const [inputValue, setInputValue] = useState('');
	const [folderDestination, setFolderDestination] = useState<Folder | undefined>();
	const [moveConvModal, setMoveConvModal] = useState(true);

	const onCloseModal = useCallback(() => {
		setMoveConvModal(true);
		setInputValue('');
		setFolderDestination(undefined);
		onClose();
	}, [onClose]);

	const onConfirmConvMove = useCallback(
		(id) => {
			dispatch(
				convAction({
					operation: `move`,
					ids: selectedIDs,
					parent: id
				})
			)
				.then((res) => {
					if (res.type.includes('fulfilled')) {
						deselectAll?.();
						createSnackbar({
							key: `edit`,
							replace: true,
							type: 'info',
							label: isRestore
								? t('messages.snackbar.email_restored', 'E-mail restored in destination folder')
								: t('messages.snackbar.conversation_move', 'Conversation successfully moved'),
							autoHideTimeout: 3000,
							actionLabel: t('action.goto_folder', 'GO TO FOLDER'),
							onActionClick: () => {
								replaceHistory(`/folder/${id}`);
							}
						});
					} else {
						createSnackbar({
							key: `edit`,
							replace: true,
							type: 'error',
							label: t('label.error_try_again', 'Something went wrong, please try again'),
							autoHideTimeout: 3000,
							hideButton: true
						});
					}
					setMoveConvModal(false);
					onCloseModal();
				})
				.catch(() => noop);
		},
		[dispatch, selectedIDs, onCloseModal, deselectAll, createSnackbar, isRestore]
	);

	const onConfirmMessageMove = useCallback(
		(newFolderId = 0) => {
			dispatch(
				msgAction({
					operation: `move`,
					ids: selectedIDs,
					parent: newFolderId
				})
			)
				.then((res) => {
					if (res.type.includes('fulfilled')) {
						deselectAll?.();
						createSnackbar({
							key: `edit`,
							replace: true,
							type: 'info',
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
							type: 'error',
							label: t('label.error_try_again', 'Something went wrong, please try again'),
							autoHideTimeout: 3000,
							hideButton: true
						});
					}
					setMoveConvModal(false);
					onCloseModal();
				})
				.catch(() => noop);
		},
		[dispatch, selectedIDs, onCloseModal, deselectAll, createSnackbar, isRestore]
	);

	const hasSameName = useMemo(
		() => some(folderDestination?.children, ['name', inputValue]),
		[folderDestination?.children, inputValue]
	);

	const isDisabled = useMemo(() => {
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
		[hasSameName]
	);

	const onConfirm = useCallback(() => {
		createFolder({
			parentFolderId: folderDestination?.parent ?? '',
			name: inputValue
		})
			.then((res) => {
				if (!('Fault' in res) && 'folder' in res) {
					isMessageView
						? onConfirmMessageMove(res.folder[0].id)
						: onConfirmConvMove(res.folder[0].id);
				} else {
					createSnackbar({
						key: `edit`,
						replace: true,
						type: 'error',
						label: t('label.error_try_again', 'Something went wrong, please try again'),
						autoHideTimeout: 3000,
						hideButton: true
					});
				}
			})
			.catch(() => noop);
		setInputValue('');
		setFolderDestination(undefined);
	}, [
		createSnackbar,
		folderDestination?.parent,
		inputValue,
		isMessageView,
		onConfirmConvMove,
		onConfirmMessageMove
	]);

	const headerTitle = useMemo(() => {
		if (moveConvModal) {
			if (isRestore) {
				return t('label.restore', 'Restore');
			}
			return isMessageView
				? t('folder_panel.modal.move.title_modal_message', 'Move Message')
				: t('folder_panel.modal.move.title_modal_conversation', 'Move Conversation');
		}
		return t('folder_panel.modal.new.title', 'Create a new folder');
	}, [isMessageView, isRestore, moveConvModal]);

	const footerConfirm = useMemo(() => {
		if (moveConvModal) {
			if (isMessageView) {
				return () => onConfirmMessageMove(folderDestination?.id);
			}
			return () => onConfirmConvMove(folderDestination?.id);
		}
		return onConfirm;
	}, [
		folderDestination,
		isMessageView,
		moveConvModal,
		onConfirm,
		onConfirmConvMove,
		onConfirmMessageMove
	]);

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
	}, [isRestore, moveConvModal]);

	const modalFooterTooltip = isDisabled
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
					showTrashFolder={false}
					showSpamFolder={false}
					allowRootSelection={false}
					allowFolderCreation={false}
				/>
				<ModalFooter
					tooltip={modalFooterTooltip}
					onConfirm={footerConfirm}
					secondaryAction={footerSecondary}
					label={footerLabel}
					secondaryLabel={moveConvModal ? t('label.cancel', 'Cancel') : t('go_back', 'Go Back')}
					disabled={isDisabled}
				/>
			</Container>
		</Container>
	);
};

export default MoveConvMessage;
