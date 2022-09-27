/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { SyntheticEvent, useContext, useMemo } from 'react';
import {
	FOLDERS,
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore
	Folder,
	t,
	replaceHistory
} from '@zextras/carbonio-shell-ui';
import { ModalManagerContext } from '@zextras/carbonio-design-system';
import { startsWith } from 'lodash';
import { useDispatch } from 'react-redux';
import { folderAction } from '../../store/actions/folder-action';
import { StoreProvider } from '../../store/redux';
import { DeleteModal } from './delete-modal';
import { EditModal } from './edit-modal';
import { EmptyModal } from './empty-modal';
import { MoveModal } from './move-modal';
import { NewModal } from './new-modal';
import { SharesInfoModal } from './shares-info-modal';
import ShareFolderModal from './share-folder-modal';
import { FolderActionsType } from '../../commons/utils';

type FolderActionsProps = {
	id: string;
	icon: string;
	label: string;
	click: (e: SyntheticEvent<HTMLElement, Event> | KeyboardEvent) => void;
	disabled?: boolean;
};

export const useFolderActions = (folder: Folder): Array<FolderActionsProps> => {
	const dispatch = useDispatch();
	// eslint-disable-next-line @typescript-eslint/ban-types
	const createModal = useContext(ModalManagerContext) as Function;

	const actions = useMemo(
		() => [
			{
				id: FolderActionsType.NEW,
				icon: 'FolderAddOutline',
				label: t('label.new_folder', 'New Folder'),
				click: (e: SyntheticEvent<HTMLElement, Event> | KeyboardEvent): void => {
					if (e) {
						e.stopPropagation();
					}
					const closeModal = createModal(
						{
							maxHeight: '90vh',
							children: (
								<StoreProvider>
									<NewModal folder={folder} onClose={(): void => closeModal()} />
								</StoreProvider>
							)
						},
						true
					);
				}
			},
			{
				id: FolderActionsType.MOVE,
				icon: 'MoveOutline',
				label: startsWith(folder.absFolderPath, '/Trash')
					? t('label.restore', 'Restore')
					: t('label.move', 'Move'),
				click: (e: SyntheticEvent<HTMLElement, Event> | KeyboardEvent): void => {
					if (e) {
						e.stopPropagation();
					}
					const closeModal = createModal(
						{
							maxHeight: '90vh',
							children: (
								<StoreProvider>
									<MoveModal folder={folder} onClose={(): void => closeModal()} />
								</StoreProvider>
							)
						},
						true
					);
				}
			},
			{
				id: FolderActionsType.EMPTY,
				icon: folder.id === FOLDERS.TRASH ? 'DeletePermanentlyOutline' : 'EmptyFolderOutline',
				label:
					folder.id === FOLDERS.TRASH
						? t('folder_panel.action.empty.trash', 'Empty Trash')
						: t('folder_panel.action.wipe.folder_panel', 'Wipe Folder'),
				disabled: folder.n === 0 && folder.children?.length === 0,
				click: (e: SyntheticEvent<HTMLElement, Event> | KeyboardEvent): void => {
					if (e) {
						e.stopPropagation();
					}
					const closeModal = createModal(
						{
							children: (
								<StoreProvider>
									<EmptyModal onClose={(): void => closeModal()} folder={folder} />
								</StoreProvider>
							)
						},
						true
					);
				}
			},
			{
				id: FolderActionsType.EDIT,
				icon: 'Edit2Outline',
				label: folder.isLink
					? t('folder_panel.action.edit_properties', 'Edit Properties')
					: t('label.edit', 'Edit'),
				click: (e: SyntheticEvent<HTMLElement, Event> | KeyboardEvent): void => {
					if (e) {
						e.stopPropagation();
					}
					const closeModal = createModal(
						{
							maxHeight: '90vh',
							children: (
								<StoreProvider>
									<EditModal onClose={(): void => closeModal()} folder={folder} />
								</StoreProvider>
							)
						},
						true
					);
				}
			},
			{
				id: FolderActionsType.DELETE,
				icon: 'Trash2Outline',
				label: startsWith(folder.absFolderPath, '/Trash')
					? t('label.delete_permanently', 'Delete Permanently')
					: t('label.delete', 'Delete'),
				click: (e: SyntheticEvent<HTMLElement, Event> | KeyboardEvent): void => {
					if (e) {
						e.stopPropagation();
					}
					const closeModal = createModal(
						{
							children: (
								<StoreProvider>
									<DeleteModal onClose={(): void => closeModal()} folder={folder} />
								</StoreProvider>
							)
						},
						true
					);
				}
			},
			{
				id: FolderActionsType.SHARE,
				icon: 'ShareOutline',
				label: t('action.share_folder', 'Share folder'),
				click: (e: SyntheticEvent<HTMLElement, Event> | KeyboardEvent): void => {
					if (e) {
						e.stopPropagation();
					}
					const closeModal = createModal(
						{
							children: (
								<StoreProvider>
									<ShareFolderModal onClose={(): void => closeModal()} folder={folder} />
								</StoreProvider>
							)
						},
						true
					);
				}
			},
			{
				id: FolderActionsType.REMOVE_FROM_LIST,
				icon: 'CloseOutline',
				label: t('label.remove_from_this_list', 'Remove from this list'),
				click: (e: SyntheticEvent<HTMLElement, Event> | KeyboardEvent): void => {
					if (e) {
						e.stopPropagation();
						dispatch(folderAction({ folder, op: 'delete' }));
					}
				}
			},
			{
				id: FolderActionsType.SHARES_INFO,
				icon: 'InfoOutline',
				label: t('label.shares_info', `Shared folder's info`),
				click: (e: SyntheticEvent<HTMLElement, Event> | KeyboardEvent): void => {
					if (e) {
						e.stopPropagation();
					}
					const closeModal = createModal(
						{
							children: (
								<StoreProvider>
									<SharesInfoModal onClose={(): void => closeModal()} folder={folder} />
								</StoreProvider>
							)
						},
						true
					);
				}
			},
			{
				id: FolderActionsType.MARK_ALL_READ,
				icon: 'EmailReadOutline',
				label: t('label.mark_all_as_read', 'Mark all as read'),
				click: (e: SyntheticEvent<HTMLElement, Event> | KeyboardEvent): void => {
					if (e) {
						e.stopPropagation();
						dispatch(folderAction({ folder, op: 'read', l: folder.id }));
					}
				}
			}
		],
		[createModal, dispatch, folder]
	);

	const defaultFolderActions = useMemo(
		() =>
			actions.filter(
				(action) =>
					action.id !== FolderActionsType.SHARES_INFO &&
					action.id !== FolderActionsType.REMOVE_FROM_LIST
			),
		[actions]
	);
	const id =
		folder.id.indexOf(':') !== -1 ? folder.id.slice(folder.id.indexOf(':') + 1) : folder.id;

	switch (id) {
		// default folders
		case FOLDERS.INBOX:
		case FOLDERS.SENT:
		case FOLDERS.DRAFTS:
			return defaultFolderActions.map((action) =>
				action.id === FolderActionsType.MOVE || action.id === FolderActionsType.DELETE
					? { ...action, disabled: true }
					: action
			);

		case FOLDERS.SPAM:
			return defaultFolderActions.map((action) =>
				action.id === FolderActionsType.NEW ||
				action.id === FolderActionsType.MOVE ||
				action.id === FolderActionsType.DELETE
					? { ...action, disabled: true }
					: action
			);
		case FOLDERS.TRASH:
			return defaultFolderActions.map((action) =>
				action.id === FolderActionsType.MOVE ||
				action.id === FolderActionsType.DELETE ||
				action.id === FolderActionsType.EDIT ||
				action.id === FolderActionsType.SHARE
					? { ...action, disabled: true }
					: action
			);
		// customizable folders
		default:
			return folder.isLink
				? actions.filter(
						(action) =>
							action.id === FolderActionsType.SHARES_INFO ||
							action.id === FolderActionsType.REMOVE_FROM_LIST ||
							action.id === FolderActionsType.EDIT
				  )
				: defaultFolderActions.map((action) => {
						if (
							startsWith(folder.absFolderPath, '/Trash') &&
							(action.id === FolderActionsType.NEW || action.id === FolderActionsType.EDIT)
						) {
							return { ...action, disabled: true };
						}
						return action;
				  });
	}
};
