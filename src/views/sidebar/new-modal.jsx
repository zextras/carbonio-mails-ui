/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Container, CustomModal, Input, Text, Padding } from '@zextras/zapp-ui';
import { filter, map, includes } from 'lodash';
import { nanoid } from '@reduxjs/toolkit';
import FolderItem from './commons/folder-item';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
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
	const [folderPosition, setFolderPosition] = useState(currentFolder.name);
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

		setInputValue('');
		setLabel(t('folder_panel.modal.new.input.name', 'Enter Folder Name'));
		setFolderDestination('');
		setModal('');
		setHasError(false);
	}, [dispatch, folderDestination, inputValue, setModal, setNew, t, createSnackbar]);

	const onClose = useCallback(() => {
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
						label={t('folder_panel.modal.new.input.position', 'Parent Folder')}
						backgroundColor="gray5"
						value={folderPosition}
						// defaultValue={t('folder_panel.lists_item.root', "/Root")}
						onChange={(e) => setFolderPosition(e.target.value)}
					/>
					<FolderItem folders={data} />
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
