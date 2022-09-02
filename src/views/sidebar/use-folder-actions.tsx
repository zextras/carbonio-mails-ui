/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { useCallback, useContext, useMemo, useState } from 'react';
import { ModalManagerContext } from '@zextras/carbonio-design-system';
import { Folder, FOLDERS } from '@zextras/carbonio-shell-ui';
import { startsWith } from 'lodash';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { FolderActionsType } from '../../commons/utils';
import { folderAction } from '../../store/actions/folder-action';
import { DeleteModal } from './delete-modal';
import { EditModal } from './edit-modal';
import { EmptyModal } from './empty-modal';
import { MoveModal } from './move-modal';
import { NewModal } from './new-modal';
import ShareFolderModal from './share-folder-modal';
import { SharesInfoModal } from './shares-info-modal';

type FolderActionsProps = {
	id: string;
	icon: string;
	label: string;
	click: (e: MouseEvent) => void;
	disabled?: boolean;
};
export const useFolderActions = (folder: Folder): Array<FolderActionsProps> => {
	const [t] = useTranslation();
	const dispatch = useDispatch();
	// eslint-disable-next-line @typescript-eslint/ban-types
	const createModal = useContext(ModalManagerContext) as Function;
	const [activeModal, setActiveModal] = useState('default');
	const [activeGrant, setActiveGrant] = useState({});
	const goBack = useCallback(() => {
		setActiveModal('default');
	}, [setActiveModal]);

	// const newFolder = useCallback(
	// 	(_folder, _createModal, t) => ({
	// 		id: FolderActionsType.NEW,
	// 		icon: 'FolderAddOutline',
	// 		label: t('label.new_folder', 'New Folder'),
	// 		click: (e: MouseEvent): void => {
	// 			if (e) {
	// 				e.stopPropagation();
	// 			}
	// 			const closeModal = createModal(
	// 				{
	// 					maxHeight: '90vh',
	// 					children: (
	// 						<>
	// 							<NewModal folder={_folder} onClose={(): void => closeModal()} />
	// 						</>
	// 					)
	// 				},
	// 				true
	// 			);
	// 		}
	// 	}),
	// 	[folder, createModal, t]
	// );

	const actions = useMemo(
		() => [
			{
				id: FolderActionsType.NEW,
				icon: 'FolderAddOutline',
				label: t('label.new_folder', 'New Folder'),
				click: (e: MouseEvent): void => {
					if (e) {
						e.stopPropagation();
					}
					const closeModal = createModal(
						{
							maxHeight: '90vh',
							children: (
								<>
									<NewModal folder={folder} onClose={(): void => closeModal()} />
								</>
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
				click: (e: MouseEvent): void => {
					if (e) {
						e.stopPropagation();
					}
					const closeModal = createModal(
						{
							maxHeight: '90vh',
							children: (
								<>
									<MoveModal folder={folder} onClose={(): void => closeModal()} />
								</>
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
				click: (e: MouseEvent): void => {
					if (e) {
						e.stopPropagation();
					}
					const closeModal = createModal(
						{
							children: (
								<>
									<EmptyModal onClose={(): void => closeModal()} folder={folder} />
								</>
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
				click: (e: MouseEvent): void => {
					if (e) {
						e.stopPropagation();
					}
					const closeModal = createModal(
						{
							maxHeight: '90vh',
							children: (
								<>
									<EditModal onClose={(): void => closeModal()} folder={folder} />
								</>
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
				click: (e: MouseEvent): void => {
					if (e) {
						e.stopPropagation();
					}
					const closeModal = createModal(
						{
							children: (
								<>
									<DeleteModal onClose={(): void => closeModal()} folder={folder} />
								</>
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
				click: (e: MouseEvent): void => {
					if (e) {
						e.stopPropagation();
					}
					const closeModal = createModal(
						{
							children: (
								<>
									<ShareFolderModal
										onClose={(): void => closeModal()}
										folder={folder}
										activeGrant={activeGrant}
										goBack={goBack}
									/>
								</>
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
				click: (e): void => {
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
				click: (e): void => {
					if (e) {
						e.stopPropagation();
					}
					const closeModal = createModal(
						{
							children: (
								<>
									<SharesInfoModal onClose={(): void => closeModal()} folder={folder} />
								</>
							)
						},
						true
					);
				}
			}
		],
		[activeGrant, createModal, dispatch, folder, goBack, t]
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
