/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useCallback, useMemo, useState } from 'react';
import { Input, Text, Container, CustomModal, Padding, Button } from '@zextras/zapp-ui';
import { filter, startsWith, reduce, isEmpty } from 'lodash';
import FolderItem from './commons/folder-item';
import { folderAction } from '../../store/actions/folder-action';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
// eslint-disable-next-line import/extensions
import ModalFooter from './commons/modal-footer';
import { ModalHeader } from './commons/modal-header';

export const MoveModal = ({
	folders,
	currentFolder,
	openModal,
	setModal,
	dispatch,
	t,
	createSnackbar
}) => {
	const [input, setInput] = useState('');
	const [folderDestination, setFolderDestination] = useState(currentFolder || {});

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
								onClick: () => setFolderDestination(item),
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
				background: folderDestination.id === '1' ? 'highlight' : undefined,
				onClick: () => setFolderDestination({ id: '1' })
			}
		],
		[filterFromInput, folderDestination.id, folders, nestFilteredFolders]
	);

	const onConfirm = useCallback(() => {
		const restoreFolder = () =>
			dispatch(folderAction({ folder: currentFolder, l: currentFolder.parent, op: 'move' })).then(
				(res) => {
					if (res.type.includes('fulfilled')) {
						createSnackbar({
							key: `move-folder`,
							replace: true,
							type: 'success',
							label: t('messages.snackbar.folder_restored', 'Folder restored'),
							autoHideTimeout: 3000,
							hideButton: true
						});
					} else {
						createSnackbar({
							key: `move`,
							replace: true,
							type: 'error',
							label: t('label.error_try_again', 'Something went wrong, please try again'),
							autoHideTimeout: 3000,
							hideButton: true
						});
					}
				}
			);

		if (
			folderDestination?.id !== currentFolder?.id &&
			folderDestination.id !== currentFolder.parent
		) {
			dispatch(
				folderAction({ folder: currentFolder, l: folderDestination.id || '1', op: 'move' })
			).then((res) => {
				if (res.type.includes('fulfilled')) {
					createSnackbar({
						key: `move`,
						replace: true,
						type: 'success',
						label: t('messages.snackbar.folder_moved', 'Folder successfully moved'),
						autoHideTimeout: 5000,
						hideButton: false,
						actionLabel: 'Undo',
						onActionClick: () => restoreFolder()
					});
				} else {
					createSnackbar({
						key: `move`,
						replace: true,
						type: 'error',
						label: t('label.error_try_again', 'Something went wrong, please try again.'),
						autoHideTimeout: 3000
					});
				}
			});
		}

		setFolderDestination('');
		setInput('');
		setModal('');
	}, [dispatch, currentFolder, folderDestination.id, setModal, createSnackbar, t]);

	const onClose = useCallback(() => {
		setModal('');
		setInput('');
		setFolderDestination('');
	}, [setModal]);

	return currentFolder ? (
		<CustomModal open={openModal} onClose={onClose} maxHeight="90vh">
			<Container
				padding={{ all: 'large' }}
				mainAlignment="center"
				crossAlignment="flex-start"
				height="fit"
			>
				<ModalHeader
					onClose={onClose}
					title={`${t('label.move', 'Move')} ${currentFolder.label}`}
				/>
				<Container
					padding={{ all: 'small' }}
					mainAlignment="center"
					crossAlignment="flex-start"
					height="fit"
				>
					<Container padding={{ all: 'small' }} mainAlignment="center" crossAlignment="flex-start">
						<Text overflow="break-word">
							{t(
								'folder_panel.modal.move.body.message1',
								'Select a folder to move the considered one to:'
							)}
						</Text>
					</Container>
					<Input
						inputName={currentFolder.label}
						label={t('label.filter_folders', 'Filter folders')}
						backgroundColor="gray5"
						value={input}
						onChange={(e) => setInput(e.target.value)}
					/>
					<Padding vertical="medium" />
					<FolderItem folders={nestedData} />
					<Container
						padding={{ top: 'medium', bottom: 'medium' }}
						mainAlignment="center"
						crossAlignment="flex-start"
					>
						<Button type="ghost" label={t('label.new_folder', 'New Folder')} color="primary" />
					</Container>
					<ModalFooter
						onConfirm={onConfirm}
						secondaryAction={onClose}
						label={t('label.move', 'Move')}
						secondaryLabel={t('label.cancel', 'Cancel')}
						disabled={!folderDestination.id}
						t={t}
					/>
				</Container>
			</Container>
		</CustomModal>
	) : (
		<></>
	);
};
