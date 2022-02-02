/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Container, CustomModal, Input, Text, Padding } from '@zextras/carbonio-design-system';
import { filter, includes, map, reduce, reject, startsWith } from 'lodash';
import { nanoid } from '@reduxjs/toolkit';
import { FOLDERS } from '@zextras/carbonio-shell-ui';
import FolderItem from './commons/folder-item';
// eslint-disable-next-line import/extensions
import ModalFooter from './commons/modal-footer.tsx';
import { ModalHeader } from './commons/modal-header';
import { createFolder } from '../../store/actions/create-folder';

export const NewModal = ({
	folders,
	currentFolder,
	openModal,
	setModal,
	dispatch,
	setNew,
	t,
	createSnackbar
}) => {
	const [inputValue, setInputValue] = useState('');
	const [input, setInput] = useState('');
	const [folderDestination, setFolderDestination] = useState(currentFolder);
	const [disabled, setDisabled] = useState(true);
	const [hasError, setHasError] = useState(false);
	const [label, setLabel] = useState(t('folder_panel.modal.new.input.name', 'Enter Folder Name'));
	const folderArray = useMemo(
		() => [
			t('folders.inbox', 'Inbox'),
			t('label.sent', 'Sent'),
			t('folders.drafts', 'Drafts'),
			t('folders.trash', 'Trash'),
			t('folders.spam', 'Spam')
		],
		[t]
	);
	const showWarning = useMemo(() => includes(folderArray, inputValue), [folderArray, inputValue]);

	useEffect(() => {
		setFolderDestination(currentFolder);
	}, [currentFolder]);

	useEffect(() => {
		if (!folderDestination || !inputValue.length || showWarning) {
			setDisabled(true);
			return;
		}
		const value = !!filter(folderDestination.items, (item) => item.label === inputValue).length;
		if (value) {
			setLabel(t('folder_panel.modal.new.input.name_exist', 'Name already exists in this path'));
		} else {
			setLabel(t('folder_panel.modal.new.input.name', 'Enter Folder Name'));
		}
		setHasError(value);
		setDisabled(value);
	}, [folderDestination, inputValue, showWarning, t]);

	const normalizedFolders = useMemo(
		() =>
			map(
				// reject all mismatching condition folders
				reject(
					folders,
					(v) =>
						v.parent === FOLDERS.TRASH ||
						v.absParent === FOLDERS.TRASH ||
						v.level > 2 ||
						v.id === FOLDERS.TRASH ||
						v.id === FOLDERS.SPAM
				),
				(f) => ({
					...f,
					onClick: () => setFolderDestination(f),
					open: !!input.length,
					divider: true,
					background: folderDestination.id === f.id ? 'highlight' : undefined
				})
			),
		[folderDestination.id, folders, input.length]
	);

	const filteredFromUserInput = useMemo(
		() =>
			filter(normalizedFolders, (item) =>
				startsWith(item.label.toLowerCase(), input.toLowerCase())
			),
		[input, normalizedFolders]
	);

	const nestFilteredFolders = useCallback(
		(items, id, results) =>
			reduce(
				filter(items, (item) => item.parent === id),
				(acc, item) => [
					...acc,
					{
						...item,
						items: nestFilteredFolders(items, item.id, results),
						onClick: () => setFolderDestination(item),
						open: !!input.length,
						divider: true,
						background: folderDestination.id === item.id ? 'highlight' : undefined
					}
				],
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
				items:
					input.length > 0
						? filteredFromUserInput
						: nestFilteredFolders(normalizedFolders, FOLDERS.USER_ROOT),
				background: folderDestination.id === FOLDERS.USER_ROOT ? 'highlight' : undefined,
				onClick: () => setFolderDestination({ id: FOLDERS.USER_ROOT })
			}
		],
		[filteredFromUserInput, folderDestination.id, input, nestFilteredFolders, normalizedFolders]
	);

	const onConfirm = useCallback(() => {
		dispatch(
			createFolder({ parentFolder: folderDestination, name: inputValue, id: nanoid() })
		).then((res) => {
			if (res.type.includes('fulfilled')) {
				createSnackbar({
					key: `edit`,
					replace: true,
					type: 'success',
					label: t('messages.snackbar.folder_created', 'New folder created'),
					autoHideTimeout: 3000,
					hideButton: true
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
			setNew({
				id: res.meta.arg.parentFolder.id,
				absParent: res.meta.arg.parentFolder.absParent
			});
		});
		setInput('');
		setInputValue('');
		setLabel(t('folder_panel.modal.new.input.name', 'Enter Folder Name'));
		setFolderDestination('');
		setModal('');
		setHasError(false);
	}, [dispatch, folderDestination, inputValue, setModal, setNew, t, createSnackbar]);

	const onClose = useCallback(() => {
		setInput('');
		setInputValue('');
		setModal('');
		setFolderDestination('');
		setLabel(t('folder_panel.modal.new.input.name', 'Enter Folder Name'));
		setHasError(false);
	}, [setModal, t]);

	return currentFolder ? (
		<CustomModal open={openModal} onClose={onClose} maxHeight="90vh">
			<Container
				padding={{ all: 'large' }}
				mainAlignment="center"
				crossAlignment="flex-start"
				height="fit"
			>
				<ModalHeader
					title={t('folder_panel.modal.new.title', 'Create a new folder')}
					onClose={onClose}
				/>
				<Container mainAlignment="center" crossAlignment="flex-start">
					<Input
						label={label}
						backgroundColor="gray5"
						hasError={hasError}
						defaultValue={inputValue}
						onChange={(e) => setInputValue(e.target.value)}
					/>
					{showWarning && (
						<Padding all="small">
							<Text size="small" color="error">
								{`${t(
									'folder.modal.edit.rename_warning',
									'You cannot rename a folder as a system one.'
								)}`}
							</Text>
						</Padding>
					)}
					<Input
						label={t('label.filter_folders', 'Filter folders')}
						backgroundColor="gray5"
						value={input}
						onChange={(e) => setInput(e.target.value)}
					/>
					<FolderItem folders={nestedData} />
					<ModalFooter
						onConfirm={onConfirm}
						secondaryAction={onClose}
						label={t('label.create', 'Create')}
						t={t}
						disabled={disabled}
					/>
				</Container>
			</Container>
		</CustomModal>
	) : (
		<></>
	);
};
