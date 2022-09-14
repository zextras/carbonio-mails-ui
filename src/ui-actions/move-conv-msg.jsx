/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useCallback, useMemo, useState, useContext } from 'react';
import {
	Container,
	Input,
	Padding,
	SnackbarManagerContext,
	Text
} from '@zextras/carbonio-design-system';
import { some } from 'lodash';
import { useDispatch } from 'react-redux';
import { nanoid } from '@reduxjs/toolkit';
import { FOLDERS, replaceHistory, t } from '@zextras/carbonio-shell-ui';
import { convAction, msgAction } from '../store/actions';
import { createFolder } from '../store/actions/create-folder';
import { ModalHeader } from '../views/sidebar/commons/modal-header';
import { FolderSelector } from '../views/sidebar/commons/folder-selector';
import ModalFooter from '../views/sidebar/commons/modal-footer';

const MoveConvMessage = ({
	selectedIDs,
	isMessageView,
	isRestore,
	deselectAll,
	onClose,
	folderId
}) => {
	const [inputValue, setInputValue] = useState('');
	const [folderDestination, setFolderDestination] = useState();
	const [moveConvModal, setMoveConvModal] = useState(true);
	const dispatch = useDispatch();
	const createSnackbar = useContext(SnackbarManagerContext);

	const onCloseModal = useCallback(() => {
		setMoveConvModal(true);
		setInputValue('');
		setFolderDestination('');
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
			).then((res) => {
				if (res.type.includes('fulfilled')) {
					deselectAll && deselectAll();
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
			});
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
			).then((res) => {
				if (res.type.includes('fulfilled')) {
					deselectAll && deselectAll();
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
			});
		},
		[onCloseModal, createSnackbar, dispatch, selectedIDs, isRestore, deselectAll]
	);

	const hasSameName = useMemo(
		() => some(folderDestination?.children, ['name', inputValue]),
		[folderDestination?.children, inputValue]
	);

	const isDisabled = useMemo(() => {
		if (moveConvModal) {
			return (
				!folderDestination ||
				folderDestination?.id === folderId ||
				folderDestination?.id === FOLDERS.USER_ROOT
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
		dispatch(
			createFolder({ parentFolder: folderDestination, name: inputValue, id: nanoid() })
		).then((res) => {
			if (res.type.includes('fulfilled')) {
				isMessageView
					? onConfirmMessageMove(res.payload[0].id)
					: onConfirmConvMove(res.payload[0].id);
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
		});
		setInputValue('');
		setFolderDestination('');
	}, [
		dispatch,
		folderDestination,
		inputValue,
		isMessageView,
		onConfirmConvMove,
		onConfirmMessageMove,
		createSnackbar
	]);

	const headerTitle = useMemo(() => {
		if (moveConvModal) {
			if (isRestore) {
				return t('label.restore', 'Restore');
			}
			return t('folder_panel.modal.move.title_modal', 'Move Conversation');
		}
		return t('folder_panel.modal.new.title', 'Create a new folder');
	}, [isRestore, moveConvModal]);

	const footerConfirm = useMemo(() => {
		if (moveConvModal) {
			if (isMessageView) {
				return () => onConfirmMessageMove(folderDestination.id);
			}
			return () => onConfirmConvMove(folderDestination.id);
		}
		return onConfirm;
	}, [
		folderDestination?.id,
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
				: () => {
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
							onChange={(e) => setInputValue(e.target.value)}
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
					onNewFolderClick={moveConvModal ? () => setMoveConvModal(false) : undefined}
					folderId={folderId}
					folderDestination={folderDestination}
					setFolderDestination={setFolderDestination}
				/>
				<ModalFooter
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
