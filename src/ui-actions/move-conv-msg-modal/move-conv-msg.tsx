/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useCallback, useEffect, useMemo, useState, FC } from 'react';

import { filter, map, isEmpty, reduce, startsWith } from 'lodash';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { nanoid } from '@reduxjs/toolkit';
import {
	Folder,
	FOLDERS,
	getBridgedFunctions,
	replaceHistory,
	UserFolder
} from '@zextras/carbonio-shell-ui';
import { NewFolderConvoMsgMove } from './new-folder-conv-msg-move';
import { MoveConvMsgModal } from './move-conv-msg-modal';
import { selectFolders } from '../../store/folders-slice';
import { convAction, msgAction } from '../../store/actions';
import { createFolder } from '../../store/actions/create-folder';

type MoveConvMsgPropType = {
	selectedIDs: string | undefined | Array<string>;
	isMessageView: boolean;
	isRestore: boolean;
	deselectAll: () => void;
	onClose?: () => void;
};
const MoveConvMessage: FC<MoveConvMsgPropType> = ({
	selectedIDs,
	isMessageView,
	isRestore,
	deselectAll,
	onClose
}) => {
	const [inputValue, setInputValue] = useState('');
	const [t] = useTranslation();
	const [moveConvModal, setMoveConvModal] = useState(true);
	const [disabled, setDisabled] = useState(true);
	const [hasError, setHasError] = useState(false);
	const [label, setLabel] = useState(t('folder_panel.modal.new.input.name', 'Folder Name'));
	const dispatch = useDispatch();

	const [currentFolder, setCurrentFolder] = useState<UserFolder>();
	const [folderDestination, setFolderDestination] = useState<any>(currentFolder);
	const [folderPosition, setFolderPosition] = useState(currentFolder?.name ?? '');
	const allFolders = useSelector(selectFolders);
	const [input, setInput] = useState('');

	const folders = useMemo(
		() =>
			reduce(
				allFolders,
				(
					a: Array<{
						id: string;
						parent: Folder;
						label: string;
						items?: Array<any>;
						to?: string;
						depth: number;
					}>,
					c: {
						id: string;
						parent: Folder;
						name: string;
						depth: number;
					}
				) => {
					a.push({
						...c,
						id: c.id,
						parent: c.parent,
						label: c.name,
						items: [],
						to: `/folder/${c.id}`,
						depth: c.depth
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
					v.id === currentFolder?.id ||
					v.id === currentFolder?.parent?.id ||
					v.parent.id === FOLDERS.TRASH ||
					// eslint-disable-next-line @typescript-eslint/ban-ts-comment
					// @ts-ignore
					(v.absParent === currentFolder?.absParent && v.depth > (currentFolder?.depth ?? 0)) ||
					(v.depth + (currentFolder?.depth ?? 0) > 3 && v.depth !== 0)
				) {
					return false;
				}
				return startsWith(v.label.toLowerCase(), input.toLowerCase());
			}),
		[
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			currentFolder?.absParent,
			currentFolder?.depth,
			currentFolder?.id,
			currentFolder?.parent,
			folders,
			input
		]
	);
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore
	const nestFilteredFolders = useCallback(
		(items, id, results) =>
			reduce(
				filter(
					items,
					(item) => item.parent === id && item.id !== FOLDERS.SPAM && item.id !== FOLDERS.TRASH
				),
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				(acc, item) => {
					const match = filter(results, (result) => result.id === item.id);
					if (match && match.length) {
						return [
							...acc,
							{
								...item,
								items: nestFilteredFolders(items, item.id, results),
								onClick: (): void => {
									setCurrentFolder(item.id);
								},
								open: !!input.length,
								divider: true,
								active: currentFolder === item.id
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
		[input.length, currentFolder]
	);

	const nestedData = useMemo(
		() => [
			{
				id: FOLDERS.USER_ROOT,
				label: 'Root',
				level: '0',
				open: true,
				items: nestFilteredFolders(folders, FOLDERS.USER_ROOT, filterFromInput),
				background: folderDestination?.id === FOLDERS.USER_ROOT ? 'highlight' : undefined
			}
		],
		[filterFromInput, folderDestination?.id, folders, nestFilteredFolders]
	);
	const onCloseModal = useCallback(() => {
		setMoveConvModal(true);
		setInputValue('');
		setFolderDestination(undefined);
		setLabel(t('folder_panel.modal.new.input.name', 'Folder Name'));
		setHasError(false);
		if (onClose) onClose();
	}, [onClose, t]);
	const onConfirmConvMove = useCallback(
		(newFolderId = 0) => {
			dispatch(
				convAction({
					operation: `move`,
					ids:
						// eslint-disable-next-line no-nested-ternary
						selectedIDs === undefined
							? []
							: typeof selectedIDs === 'string'
							? [selectedIDs]
							: selectedIDs,
					parent: newFolderId > 0 ? newFolderId : currentFolder
				})
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
			).then((res) => {
				if (res.type.includes('fulfilled')) {
					deselectAll && deselectAll();
					getBridgedFunctions()?.createSnackbar({
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
					getBridgedFunctions()?.createSnackbar({
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
		[dispatch, selectedIDs, currentFolder, onCloseModal, deselectAll, isRestore, t]
	);

	const onConfirmMessageMove = useCallback(
		(newFolderId = 0) => {
			dispatch(
				msgAction({
					operation: `move`,
					ids:
						// eslint-disable-next-line no-nested-ternary
						selectedIDs === undefined
							? []
							: typeof selectedIDs === 'string'
							? [selectedIDs]
							: selectedIDs,
					parent: newFolderId > 0 ? newFolderId : currentFolder
				})
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
			).then((res) => {
				if (res.type.includes('fulfilled')) {
					deselectAll && deselectAll();
					getBridgedFunctions()?.createSnackbar({
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
					getBridgedFunctions()?.createSnackbar({
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
		[dispatch, selectedIDs, currentFolder, onCloseModal, deselectAll, isRestore, t]
	);

	const nest = useCallback(
		(items, id, level = 0): any[] =>
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
						folderDestination?.id === item.id
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
							onClick: (): void => {
								setFolderDestination(folder);
								setFolderPosition(folder.label);
							},
							open:
								folder.open ??
								// eslint-disable-next-line @typescript-eslint/ban-ts-comment
								// @ts-ignore
								(currentFolder?.absParent === FOLDERS.USER_ROOT
									? currentFolder?.id === item.id
									: // eslint-disable-next-line @typescript-eslint/ban-ts-comment
									  // @ts-ignore
									  currentFolder?.absParent === item.id),
							items: []
						};
					}
					return {
						...folder,
						onClick: (): void => {
							setFolderDestination(folder);
							setFolderPosition(folder.label);
						},
						open:
							folder.open ??
							// eslint-disable-next-line @typescript-eslint/ban-ts-comment
							// @ts-ignore
							(currentFolder?.absParent === FOLDERS.USER_ROOT
								? currentFolder?.id === item.id
								: // eslint-disable-next-line @typescript-eslint/ban-ts-comment
								  // @ts-ignore
								  currentFolder?.absParent === item.id)
					};
				}
			),
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		[currentFolder?.absParent, currentFolder?.id, folderDestination?.id]
	);

	useEffect(() => {
		setFolderDestination(currentFolder);
	}, [currentFolder]);

	useEffect(() => {
		if (!folderDestination || !inputValue.length) {
			setDisabled(true);
			return;
		}
		const value = !!filter(folderDestination?.items, (item) => item.label === inputValue).length;
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
			background: folderDestination?.id === FOLDERS.USER_ROOT ? 'gray6' : undefined // todo: fix with right color
		}),
		[folderDestination?.id, t]
	);

	const data = useMemo(() => nest([rootEl, ...folders], '0'), [folders, nest, rootEl]);

	const onConfirm = useCallback(() => {
		dispatch(
			createFolder({ parentFolder: folderDestination, name: inputValue, id: nanoid() })
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
		).then((res) => {
			if (res.type.includes('fulfilled')) {
				isMessageView
					? onConfirmMessageMove(res.payload[0].id)
					: onConfirmConvMove(res.payload[0].id);
			} else {
				getBridgedFunctions()?.createSnackbar({
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
		setFolderDestination(undefined);
		setHasError(false);
	}, [
		dispatch,
		folderDestination,
		inputValue,
		isMessageView,
		onConfirmConvMove,
		onConfirmMessageMove,
		t
	]);

	return (
		<>
			{moveConvModal ? (
				<MoveConvMsgModal
					onClose={onCloseModal}
					setMoveConvModal={setMoveConvModal}
					// eslint-disable-next-line @typescript-eslint/ban-ts-comment
					// @ts-ignore
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
					// eslint-disable-next-line @typescript-eslint/ban-ts-comment
					// @ts-ignore
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
