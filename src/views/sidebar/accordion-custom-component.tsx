/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, useCallback, useContext, useMemo, useState } from 'react';
import {
	AppLink,
	Folder,
	FOLDERS,
	replaceHistory,
	useUserSettings,
	getBridgedFunctions,
	useUserAccount
} from '@zextras/carbonio-shell-ui';
import styled from 'styled-components';
import {
	AccordionItem,
	Dropdown,
	Drag,
	Drop,
	Container,
	Tooltip,
	Avatar,
	Row,
	Padding,
	ModalManagerContext,
	SnackbarManagerContext
} from '@zextras/carbonio-design-system';
import { find, startsWith } from 'lodash';
import { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { FolderActionsType } from '../../types/folder';
import { convAction, msgAction, search } from '../../store/actions';
import { folderAction } from '../../store/actions/folder-action';
import { getFolderIconColor, getFolderIconName } from './utils';
import { NewModal } from './new-modal';
import { MoveModal } from './move-modal';
import { EmptyModal } from './empty-modal';
import { DeleteModal } from './delete-modal';
import { EditModal } from './edit-modal';
import { SharesFolderModal } from './shares-folder-modal';
import { SharesInfoModal } from './shares-info-modal';
import { SharesModal } from './shares-modal';

const DropOverlayContainer = styled(Container)`
	position: absolute;
	width: calc(248px - ${(props): number => (props.folder.level - 2) * 16}px);
	height: 100%;
	background: ${(props): string => props.theme.palette.primary.regular};
	border-radius: 4px;
	border: 4px solid #d5e3f6;
	opacity: 0.4;
`;

const DropDenyOverlayContainer = styled(Container)`
	position: absolute;
	width: calc(248px - ${(props): number => (props.folder.level - 2) * 16}px);
	height: 100%;
	background: ${(props): string => props.theme.palette.gray1.regular};
	border-radius: 4px;
	border: 4px solid #d5e3f6;
	opacity: 0.4;
`;

type ModalProps = Record<string, unknown>;

type SetDropdownActionsProps = {
	folder: Folder;
	setAction: (action: ActionProp) => void;
	t: TFunction;
	dispatch: () => void;
	createModal: (modal: ModalProps) => void;
};

type ActionProp = {
	operation: string;
	ids: string;
	parent: string;
};

// useFolderActions
const useFolderActions = (folder: Folder): any => {
	const [t] = useTranslation();
	const dispatch = useDispatch();
	const createModal = useContext(ModalManagerContext);
	const createSnackbar = useContext(SnackbarManagerContext);

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
							children: (
								<>
									<NewModal folder={folder} onClose={() => closeModal()} />
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
							children: (
								<>
									<MoveModal onClose={() => closeModal()} folder={folder} />
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
				//	disabled: folder-panel.id === '3' ? false : !folder-panel.itemsCount,
				disabled: folder.n === 0 && folder.children?.length === 0,
				click: (e: MouseEvent): void => {
					if (e) {
						e.stopPropagation();
					}
					const closeModal = createModal(
						{
							children: (
								<>
									<EmptyModal onClose={() => closeModal()} folder={folder} />
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
				label: folder?.isLink
					? t('folder_panel.action.edit_properties', 'Edit Properties')
					: t('label.edit', 'Edit'),
				click: (e: MouseEvent): void => {
					if (e) {
						e.stopPropagation();
					}
					const closeModal = createModal(
						{
							children: (
								<>
									<EditModal onClose={() => closeModal()} folder={folder} />
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
									<DeleteModal onClose={() => closeModal()} folder={folder} />
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
									<ShareModal onClose={() => closeModal()} folder={folder} />
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
				click: (e) => {
					if (e) {
						e.stopPropagation();
						dispatch(folderAction({ folder, op: 'delete' }));
					}
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
		],
		[createModal, dispatch, folder, t]
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

	switch (folder.id) {
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
			return defaultFolderActions.map((action) => action);
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

export type CustomComponentProps = {
	item: {
		folder: Folder;
		items: Array<any>;
		label: string;
		id: string;
	};
};

type DragEnterAction =
	| undefined
	| {
			success: false;
	  };

type OnDropActionProps = {
	type: string;
	data: {
		id: string;
		date: number;
		msgCount: number;
		unreadMsgCount: number;
		messages: [
			{
				id: string;
				parent: string;
				date: number;
			}
		];
		participants: [
			{
				type: string;
				address: string;
				name: string;
				fullName: string;
			},
			{
				type: string;
				address: string;
				name: string;
			}
		];
		subject: string;
		fragment: string;
		read: false;
		attachment: false;
		flagged: false;
		urgent: false;
		parentFolderId: string;
		selectedIDs: Array<string>;
	};
};

export const AccordionCustomComponent: FC<CustomComponentProps> = ({ item }) => {
	const { folder } = item;
	console.log({ item });
	const accountName = useUserAccount().name;
	const history = useHistory();
	const [t] = useTranslation();
	const dispatch = useDispatch();
	const activeFolder = history?.location?.pathname?.split?.('/')?.[3];
	const accordionItem = {
		...item,
		label: item.id === FOLDERS.USER_ROOT ? accountName : item.label,
		icon: getFolderIconName(item),
		iconColor: getFolderIconColor(item),
		activeId: item.id === activeFolder
	};
	console.log({ accordionItem });

	const onDragEnterAction = (data: OnDropActionProps): DragEnterAction => {
		if (data.type === 'conversation' || data.type === 'message') {
			if (
				data.data.parentFolderId === folder.id || // same folder not allowed
				(data.data.parentFolderId === FOLDERS.INBOX && [5, 6].includes(Number(folder.id))) || // from inbox not allowed in draft and sent
				(data.data.parentFolderId === FOLDERS.DRAFTS && ![3].includes(Number(folder.id))) || // from draft only allowed in Trash
				(folder.id === FOLDERS.DRAFTS && data.data.parentFolderId !== FOLDERS.TRASH) || // only from Trash can move in Draft
				(folder.isLink && folder.perm?.indexOf('w') === -1) // only if shared folder have write permission
			) {
				return { success: false };
			}
		}
		if (data.type === 'folder') {
			if (
				folder.id === data.data.id || // same folder not allowed
				folder.isLink || //  shared folder not allowed
				[FOLDERS.DRAFTS, FOLDERS.SPAM].includes(folder.id) // cannot be moved inside Draft and Spam
			)
				return { success: false };
		}
		return undefined;
	};

	const onDropAction = (data: OnDropActionProps): void => {
		const dragEnterResponse = onDragEnterAction(data);
		if (dragEnterResponse && dragEnterResponse?.success === false) return;
		let convMsgsIds = [data.data.id];
		if (
			data.type !== 'folder' &&
			data.data?.selectedIDs?.length &&
			data.data?.selectedIDs.includes(data.data.id)
		) {
			convMsgsIds = data.data?.selectedIDs;
		}

		if (data.type === 'folder') {
			dispatch(
				folderAction({ folder: data.data, l: folder.id || FOLDERS.USER_ROOT, op: 'move' })
			).then((res) => {
				if (res.type.includes('fulfilled')) {
					getBridgedFunctions().createSnackbar({
						key: `move`,
						replace: true,
						type: 'success',
						label: t('messages.snackbar.folder_moved', 'Folder successfully moved'),
						autoHideTimeout: 3000
					});
				} else {
					getBridgedFunctions().createSnackbar({
						key: `move`,
						replace: true,
						type: 'error',
						label: t('label.error_try_again', 'Something went wrong, please try again.'),
						autoHideTimeout: 3000
					});
				}
			});
		} else if (data.type === 'conversation') {
			dispatch(
				convAction({
					operation: `move`,
					ids: convMsgsIds,
					parent: folder.id
				})
			).then((res) => {
				if (res.type.includes('fulfilled')) {
					replaceHistory(`/folder/${activeFolder}`);
					getBridgedFunctions().createSnackbar({
						key: `edit`,
						replace: true,
						type: 'info',
						label: t('messages.snackbar.conversation_move', 'Conversation successfully moved'),
						autoHideTimeout: 3000,
						actionLabel: t('action.goto_folder', 'GO TO FOLDER'),
						onActionClick: () => {
							replaceHistory(`/folder/${folder.id}`);
						}
					});
				} else {
					getBridgedFunctions().createSnackbar({
						key: `edit`,
						replace: true,
						type: 'error',
						label: t('label.error_try_again', 'Something went wrong, please try again'),
						autoHideTimeout: 3000,
						hideButton: true
					});
				}
			});
		} else {
			dispatch(
				msgAction({
					operation: `move`,
					ids: convMsgsIds,
					parent: folder.id
				})
			).then((res) => {
				if (res.type.includes('fulfilled')) {
					getBridgedFunctions().createSnackbar({
						key: `edit`,
						replace: true,
						type: 'info',
						label: t('messages.snackbar.message_move', 'Message successfully moved'),
						autoHideTimeout: 3000,
						actionLabel: t('action.goto_folder', 'GO TO FOLDER'),
						onActionClick: () => {
							replaceHistory(`/folder/${folder.id}`);
						}
					});
				} else {
					getBridgedFunctions().createSnackbar({
						key: `edit`,
						replace: true,
						type: 'error',
						label: t('label.error_try_again', 'Something went wrong, please try again'),
						autoHideTimeout: 3000,
						hideButton: true
					});
				}
			});
		}
	};

	const dragFolderDisable = useMemo(
		() =>
			[FOLDERS.INBOX, FOLDERS.TRASH, FOLDERS.SPAM, FOLDERS.SENT, FOLDERS.DRAFTS].includes(
				folder.id
			) || folder.isLink, // Default folders and shared folders not allowed to drag
		[folder.id, folder.isLink]
	);
	const { zimbraPrefSortOrder, zimbraPrefGroupMailBy } = useUserSettings().prefs;
	const sorting = useMemo(
		() =>
			find(zimbraPrefSortOrder?.split(','), (f) => f?.split(':')?.[0] === folder.id)?.split(
				':'
			)?.[1] ?? 'dateDesc',
		[zimbraPrefSortOrder, folder.id]
	);
	const onClick = useCallback(
		(e): void => {
			e.stopPropagation();
			dispatch(
				search({
					folderId: folder.id,
					limit: 101,
					sortBy: sorting,
					types: zimbraPrefGroupMailBy
				})
			);
		},
		[dispatch, folder.id, sorting, zimbraPrefGroupMailBy]
	);

	const dropdownItems = useFolderActions(folder);
	return (
		<Drop
			acceptType={['message', 'conversation', 'folder']}
			onDrop={(data: OnDropActionProps): void => onDropAction(data)}
			onDragEnter={(data: OnDropActionProps): unknown => onDragEnterAction(data)}
			overlayAcceptComponent={<DropOverlayContainer folder={folder} />}
			overlayDenyComponent={<DropDenyOverlayContainer folder={folder} />}
		>
			<Drag
				type="folder"
				data={folder}
				dragDisabled={dragFolderDisable}
				style={{ display: 'block' }}
			>
				<AppLink
					onClick={onClick}
					to={`/folder/${folder.id}`}
					style={{ width: '100%', height: '100%', textDecoration: 'none' }}
				>
					<Dropdown contextMenu items={dropdownItems} display="block" width="100%">
						<Row>
							{item.id === FOLDERS.USER_ROOT && (
								<>
									<Padding left="small" />
									<Avatar
										label={accordionItem.label}
										colorLabel={accordionItem.iconColor}
										size="medium"
									/>
								</>
							)}
							<Padding left="small" />
							<Tooltip label={accordionItem.label} placement="right" maxWidth="100%">
								<AccordionItem item={accordionItem} />
							</Tooltip>
						</Row>
					</Dropdown>
				</AppLink>
			</Drag>
		</Drop>
	);
};
