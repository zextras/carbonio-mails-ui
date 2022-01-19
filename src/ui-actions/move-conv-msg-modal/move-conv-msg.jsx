/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useCallback, useEffect, useMemo, useState, useContext } from 'react';
import { SnackbarManagerContext } from '@zextras/carbonio-design-system';
import { filter, map, isEmpty, reduce, startsWith } from 'lodash';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { nanoid } from '@reduxjs/toolkit';
import { useReplaceHistoryCallback, FOLDERS } from '@zextras/carbonio-shell-ui';
import { NewFolderConvoMsgMove } from './new-folder-conv-msg-move';
import { MoveConvMsgModal } from './move-conv-msg-modal';
import { selectFolders } from '../../store/folders-slice';
import { convAction, msgAction } from '../../store/actions';
import { createFolder } from '../../store/actions/create-folder';

const MoveConvMessage = ({ selectedIDs, isMessageView, isRestore, deselectAll, onClose }) => {
	const [inputValue, setInputValue] = useState('');
	const [t] = useTranslation();
	const [moveConvModal, setMoveConvModal] = useState(true);
	const [disabled, setDisabled] = useState(true);
	const [hasError, setHasError] = useState(false);
	const [label, setLabel] = useState(t('folder_panel.modal.new.input.name', 'Folder Name'));
	const dispatch = useDispatch();
	const createSnackbar = useContext(SnackbarManagerContext);
	const [currentFolder, setCurrentFolder] = useState('');
	const [currentFolderName, setCurrentFolderName] = useState('');
	const [folderDestination, setFolderDestination] = useState(currentFolder || {});
	const [folderPosition, setFolderPosition] = useState(currentFolder.name);
	const allFolders = useSelector(selectFolders);
	const [input, setInput] = useState('');
	const replaceHistory = useReplaceHistoryCallback();

	const folders = useMemo(
		() =>
			reduce(
				allFolders,
				(a, c) => {
					a.push({
						...c,
						id: c.id,
						parent: c.parent,
						label: c.name,
						items: [],
						badgeCounter: c.unreadCount > 0 ? c.unreadCount : undefined,
						to: `/folder/${c.id}`
					});
					return a;
				},
				[]
			),
		[allFolders]
	);
	const filterFromInput = useMemo(
		() =>
			filter(folders, (v) => {
				if (isEmpty(v)) {
					return false;
				}
				if (
					v.id === currentFolder.id ||
					v.id === currentFolder.parent ||
					v.parent === FOLDERS.TRASH ||
					(v.absParent === currentFolder.absParent && v.level > currentFolder.level) ||
					(v.level + currentFolder.depth > 3 && v.level !== 0)
				) {
					return false;
				}
				return startsWith(v.label.toLowerCase(), input.toLowerCase());
			}),
		[
			currentFolder.absParent,
			currentFolder.depth,
			currentFolder.id,
			currentFolder.level,
			currentFolder.parent,
			folders,
			input
		]
	);
	const nestFilteredFolders = useCallback(
		(items, id, results) =>
			reduce(
				filter(
					items,
					(item) => item.parent === id && item.id !== FOLDERS.SPAM && item.id !== FOLDERS.TRASH
				),
				(acc, item) => {
					const match = filter(results, (result) => result.id === item.id);
					if (match && match.length) {
						return [
							...acc,
							{
								...item,
								items: nestFilteredFolders(items, item.id, results),
								onClick: () => {
									setCurrentFolder(item.id);
									setCurrentFolderName(item.name);
								},
								open: !!input.length,
								divider: true,
								background: folderDestination.id === item.id ? 'highlight' : undefined
							}
						];
					}
					if (match && !match.length) {
						return [...acc, ...nestFilteredFolders(items, item.id, results)];
					}
					return acc;
				},
				[]
			),
		[folderDestination.id, input.length]
	);

	const nestedData = useMemo(
		() => [
			{
				id: FOLDERS.USER_ROOT,
				label: 'Root',
				level: '0',
				open: true,
				items: nestFilteredFolders(folders, FOLDERS.USER_ROOT, filterFromInput),
				background: folderDestination.id === FOLDERS.USER_ROOT ? 'highlight' : undefined
			}
		],
		[filterFromInput, folderDestination.id, folders, nestFilteredFolders]
	);
	const onCloseModal = useCallback(() => {
		setMoveConvModal(true);
		setInputValue('');
		setFolderDestination('');
		setLabel(t('folder_panel.modal.new.input.name', 'Folder Name'));
		setHasError(false);
		onClose();
	}, [onClose, t]);
	const onConfirmConvMove = useCallback(
		(newFolderId = 0) => {
			dispatch(
				convAction({
					operation: `move`,
					ids: selectedIDs,
					parent: newFolderId > 0 ? newFolderId : currentFolder
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
							replaceHistory(`/folder/${newFolderId > 0 ? newFolderId : currentFolder}`);
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
		[
			dispatch,
			selectedIDs,
			currentFolder,
			onCloseModal,
			deselectAll,
			createSnackbar,
			isRestore,
			t,
			replaceHistory
		]
	);

	const onConfirmMessageMove = useCallback(
		(newFolderId = 0) => {
			dispatch(
				msgAction({
					operation: `move`,
					ids: selectedIDs,
					parent: newFolderId > 0 ? newFolderId : currentFolder
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
		[onCloseModal, createSnackbar, currentFolder, dispatch, selectedIDs, t, isRestore, deselectAll]
	);

	const nest = useCallback(
		(items, id, level = 0) =>
			map(
				filter(
					items,
					(item) =>
						item.parent === id &&
						item.id !== FOLDERS.TRASH &&
						item.parent === id &&
						item.id !== FOLDERS.SPAM
				),
				(item) => {
					const folder =
						folderDestination.id === item.id
							? {
									...item,
									items: nest(items, item.id, level + 1),
									background: 'highlight', // todo: fix with right color
									level,
									divider: true
							  }
							: {
									...item,
									items: nest(items, item.id, level + 1),
									level,
									divider: true
							  };

					if (folder.level > 1) {
						return {
							...folder,
							onClick: () => {
								setFolderDestination(folder);
								setFolderPosition(folder.label);
							},
							open:
								folder.open ??
								(currentFolder.absParent === FOLDERS.USER_ROOT
									? currentFolder.id === item.id
									: currentFolder.absParent === item.id),
							items: []
						};
					}
					return {
						...folder,
						onClick: () => {
							setFolderDestination(folder);
							setFolderPosition(folder.label);
						},
						open:
							folder.open ??
							(currentFolder.absParent === FOLDERS.USER_ROOT
								? currentFolder.id === item.id
								: currentFolder.absParent === item.id)
					};
				}
			),
		[currentFolder.absParent, currentFolder.id, folderDestination.id]
	);

	useEffect(() => {
		setFolderDestination(currentFolder);
	}, [currentFolder]);

	useEffect(() => {
		if (!folderDestination || !inputValue.length) {
			setDisabled(true);
			return;
		}
		const value = !!filter(folderDestination.items, (item) => item.label === inputValue).length;
		if (value) {
			setLabel(t('folder_panel.modal.new.input.name_exist'));
		} else {
			setLabel(t('folder_panel.modal.new.input.name'));
		}
		setHasError(value);
		setDisabled(value);
	}, [folderDestination, inputValue, t]);

	const rootEl = useMemo(
		() => ({
			id: FOLDERS.USER_ROOT,
			label: t('folder_panel.lists_item.root', '/Root'),
			level: 0,
			open: true,
			parent: '0',
			background: folderDestination.id === FOLDERS.USER_ROOT ? 'gray6' : undefined // todo: fix with right color
		}),
		[folderDestination.id, t]
	);

	const data = useMemo(() => nest([rootEl, ...folders], '0'), [folders, nest, rootEl]);

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
		setLabel(t('folder_panel.modal.new.input.name'));
		setFolderDestination('');
		setHasError(false);
	}, [
		dispatch,
		folderDestination,
		inputValue,
		t,
		isMessageView,
		onConfirmConvMove,
		onConfirmMessageMove,
		createSnackbar
	]);

	return (
		<>
			{moveConvModal ? (
				<MoveConvMsgModal
					onClose={onCloseModal}
					t={t}
					setMoveConvModal={setMoveConvModal}
					currentFolder={currentFolder}
					input={input}
					nestedData={nestedData}
					isMessageView={isMessageView}
					setInput={setInput}
					onConfirmMessageMove={onConfirmMessageMove}
					onConfirmConvMove={onConfirmConvMove}
					isRestore={isRestore}
				/>
			) : (
				<NewFolderConvoMsgMove
					inputValue={inputValue}
					setInputValue={setInputValue}
					label={label}
					onClose={onCloseModal}
					hasError={hasError}
					folderPosition={folderPosition}
					t={t}
					setFolderPosition={setFolderPosition}
					data={data}
					onConfirm={onConfirm}
					setMoveConvModal={setMoveConvModal}
					disabled={disabled}
					isRestore={isRestore}
				/>
			)}
		</>
	);
};

export default MoveConvMessage;
