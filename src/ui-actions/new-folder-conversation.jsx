/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useCallback, useEffect, useMemo, useState, useContext } from 'react';
import { CustomModal, SnackbarManagerContext } from '@zextras/carbonio-design-system';
import { filter, map, isEmpty, reduce, startsWith } from 'lodash';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { nanoid } from '@reduxjs/toolkit';
import { createFolder } from '../store/actions/create-folder';
import { selectFolders } from '../store/folders-slice';
import { convAction, msgAction } from '../store/actions';
import { NewFolderConvoMsgMove } from './move-conv-msg-modal/new-folder-conv-msg-move';
import { MoveConvMsgModal } from './move-conv-msg-modal/move-conv-msg-modal';

export const MoveConvMessage = ({ selectedIDs, openModal, closeModal, isMessageView }) => {
	const [inputValue, setInputValue] = useState('');
	const [t] = useTranslation();
	const [moveConvModal, setMoveConvModal] = useState(true);
	const [disabled, setDisabled] = useState(true);
	const [hasError, setHasError] = useState(false);
	const [label, setLabel] = useState(t('folder_panel.modal.new.input.name'));
	const dispatch = useDispatch();
	const createSnackbar = useContext(SnackbarManagerContext);
	const [currentFolder, setCurrentFolder] = useState('');
	const [folderDestination, setFolderDestination] = useState(currentFolder || {});
	const [folderPosition, setFolderPosition] = useState(currentFolder.name);
	const allFolders = useSelector(selectFolders);
	const [input, setInput] = useState('');
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
					v.parent === '3' ||
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
				filter(items, (item) => item.parent === id && item.id !== '4' && item.id !== '3'),
				(acc, item) => {
					const match = filter(results, (result) => result.id === item.id);
					if (match && match.length) {
						return [
							...acc,
							{
								...item,
								items: nestFilteredFolders(items, item.id, results),
								onClick: () => setCurrentFolder(item.id),
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
				id: '1',
				label: 'Root',
				level: '0',
				open: true,
				items: nestFilteredFolders(folders, '1', filterFromInput),
				background: folderDestination.id === '1' ? 'highlight' : undefined
			}
		],
		[filterFromInput, folderDestination.id, folders, nestFilteredFolders]
	);

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
					createSnackbar({
						key: `edit`,
						replace: true,
						type: 'success',
						label: t('messages.snackbar.conversation_move', 'Conversation successfully moved'),
						autoHideTimeout: 3000
					});
				} else {
					createSnackbar({
						key: `edit`,
						replace: true,
						type: 'error',
						label: t('label.error_try_again', 'Something went wrong, please try again.'),
						autoHideTimeout: 3000
					});
				}
				setMoveConvModal(false);
				closeModal();
			});
		},
		[closeModal, createSnackbar, currentFolder, dispatch, selectedIDs, t]
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
					createSnackbar({
						key: `edit`,
						replace: true,
						type: 'success',
						label: t('messages.snackbar.message_move', 'Message successfully moved'),
						autoHideTimeout: 3000
					});
				} else {
					createSnackbar({
						key: `edit`,
						replace: true,
						type: 'error',
						label: t('label.error_try_again', 'Something went wrong, please try again'),
						autoHideTimeout: 3000
					});
				}
				setMoveConvModal(false);
				closeModal();
			});
		},
		[closeModal, createSnackbar, currentFolder, dispatch, selectedIDs, t]
	);

	const nest = useCallback(
		(items, id, level = 0) =>
			map(
				filter(
					items,
					(item) => item.parent === id && item.id !== '3' && item.parent === id && item.id !== '4'
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
								(currentFolder.absParent === '1'
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
							(currentFolder.absParent === '1'
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
			setLabel(t('folder_panel.modal.new.input.name', 'Folder Name'));
		}
		setHasError(value);
		setDisabled(value);
	}, [folderDestination, inputValue, t]);

	const rootEl = useMemo(
		() => ({
			id: '1',
			label: t('folder_panel.lists_item.root', '/Root'),
			level: 0,
			open: true,
			parent: '0',
			background: folderDestination.id === '1' ? 'gray6' : undefined // todo: fix with right color
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
					label: t('label.error_try_again', 'Something went wrong, please try again.'),
					autoHideTimeout: 3000
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

	const onClose = useCallback(() => {
		setInputValue('');
		setFolderDestination('');
		setLabel(t('folder_panel.modal.new.input.name'));
		setHasError(false);
		closeModal();
		setMoveConvModal(false);
	}, [t, closeModal]);

	return (
		<CustomModal open={openModal} onClose={onClose} maxHeight="90vh">
			{moveConvModal ? (
				<MoveConvMsgModal
					onClose={onClose}
					t={t}
					setMoveConvModal={setMoveConvModal}
					currentFolder={currentFolder}
					input={input}
					nestedData={nestedData}
					isMessageView={isMessageView}
					setInput={setInput}
					onConfirmMessageMove={onConfirmMessageMove}
					onConfirmConvMove={onConfirmConvMove}
				/>
			) : (
				<NewFolderConvoMsgMove
					inputValue={inputValue}
					setInputValue={setInputValue}
					label={label}
					onClose={onClose}
					hasError={hasError}
					folderPosition={folderPosition}
					t={t}
					setFolderPosition={setFolderPosition}
					data={data}
					onConfirm={onConfirm}
					setMoveConvModal={setMoveConvModal}
					disabled={disabled}
				/>
			)}
		</CustomModal>
	);
};
