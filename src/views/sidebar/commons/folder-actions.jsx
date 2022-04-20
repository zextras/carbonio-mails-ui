/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';
import { FolderActionsType } from '../../../types/folder';
import { folderAction } from '../../../store/actions/folder-action';
import { SharesInfoModal } from '../shares-info-modal';

export const actionsRetriever = ({
	folder,
	setAction,
	setCurrentFolder,
	t,
	dispatch,
	createModal
}) => [
	{
		id: FolderActionsType.NEW,
		icon: 'FolderAddOutline',
		label: t('label.new_folder', 'New Folder'),
		click: () => {
			setAction(FolderActionsType.NEW);
			setCurrentFolder(folder);
		}
	},
	{
		id: FolderActionsType.MOVE,
		icon: 'MoveOutline',
		label: folder.absParent === '3' ? t('label.restore', 'Restore') : t('label.move', 'Move'),
		click: () => {
			setAction(FolderActionsType.MOVE);
			setCurrentFolder(folder);
		}
	},
	{
		id: FolderActionsType.EMPTY,
		icon: folder.id === '3' ? 'DeletePermanentlyOutline' : 'EmptyFolderOutline',
		label:
			folder.id === '3'
				? t('folder_panel.action.empty.trash', 'Empty Trash')
				: t('folder_panel.action.wipe.folder_panel', 'Wipe Folder'),
		//	disabled: folder-panel.id === '3' ? false : !folder-panel.itemsCount,
		disabled: folder.itemsCount === 0 && folder.items?.length === 0,
		click: () => {
			setAction(FolderActionsType.EMPTY);
			setCurrentFolder(folder);
		}
	},
	{
		id: FolderActionsType.EDIT,
		icon: 'Edit2Outline',
		label: folder?.owner
			? t('folder_panel.action.edit_properties', 'Edit Properties')
			: t('label.edit', 'Edit'),
		click: () => {
			setAction(FolderActionsType.EDIT);
			setCurrentFolder(folder);
		}
	},
	{
		id: FolderActionsType.DELETE,
		icon: 'Trash2Outline',
		label:
			folder.absParent === '3'
				? t('label.delete_permanently', 'Delete Permanently')
				: t('label.delete', 'Delete'),
		click: () => {
			setAction(FolderActionsType.DELETE);
			setCurrentFolder(folder);
		}
	},
	{
		id: FolderActionsType.SHARE,
		icon: 'ShareOutline',
		label: t('action.share_folder', 'Share folder'),
		click: () => {
			setAction(FolderActionsType.SHARE);
			setCurrentFolder(folder);
		}
	},
	{
		id: FolderActionsType.REMOVE_FROM_LIST,
		icon: 'CloseOutline',
		label: t('label.remove_from_this_list', 'Remove from this list'),
		click: (e) => {
			if (e) {
				e.stopPropagation();
				dispatch(folderAction({ folder, op: 'delete' }));
			}
			setCurrentFolder(folder);
		}
	},
	{
		id: 'sharesInfo',
		icon: 'InfoOutline',
		label: t('label.shares_info', `Shared folder's info`),
		click: (e) => {
			if (e) {
				e.stopPropagation();
			}
			setCurrentFolder(folder);
			const closeModal = createModal(
				{
					children: (
						<>
							<SharesInfoModal onClose={() => closeModal()} folder={folder} />
						</>
					)
				},
				true
			);
		}
	}
];
