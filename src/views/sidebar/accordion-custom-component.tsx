/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, SyntheticEvent, useCallback, useMemo, useState } from 'react';
import {
	AppLink,
	FOLDERS,
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore
	ROOT_NAME,
	replaceHistory,
	useUserSettings,
	getBridgedFunctions,
	useUserAccount,
	pushHistory,
	AccordionFolder,
	Folder
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
	Icon,
	Row,
	Padding,
	DragObj,
	ContainerProps
} from '@zextras/carbonio-design-system';
import { startsWith } from 'lodash';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { useParams } from 'react-router-dom';
import { convAction, msgAction, search } from '../../store/actions';
import { folderAction } from '../../store/actions/folder-action';
import { getFolderIconColor, getFolderIconName, getFolderTranslatedName } from './utils';
import { NewModal } from './new-modal';
import { MoveModal } from './move-modal';
import { EmptyModal } from './empty-modal';
import { DeleteModal } from './delete-modal';
import { EditModal } from './edit-modal';
import { SharesInfoModal } from './shares-info-modal';
import ShareFolderModal from './share-folder-modal';
import { FolderActionsType } from '../../commons/utils';
import { DataProps } from '../../types';

const FittedRow = styled(Row)`
	max-width: calc(100% - (2 * ${({ theme }): string => theme.sizes.padding.small}));
	height: 48px;
`;

const DropOverlayContainer = styled(Container)<ContainerProps & { folder: Folder }>`
	position: absolute;
	width: calc(248px - ${(props): number => (props.folder.depth - 2) * 16}px);
	height: 100%;
	background: ${(props): string => props.theme.palette.primary.regular};
	border-radius: 4px;
	border: 4px solid #d5e3f6;
	opacity: 0.4;
`;

const DropDenyOverlayContainer = styled(Container)<ContainerProps & { folder: Folder }>`
	position: absolute;
	width: calc(248px - ${(props): number => (props.folder.depth - 2) * 16}px);
	height: 100%;
	background: ${(props): string => props.theme.palette.gray1.regular};
	border-radius: 4px;
	border: 4px solid #d5e3f6;
	opacity: 0.4;
`;

type FolderActionsProps = {
	id: string;
	icon: string;
	label: string;
	click: (e: SyntheticEvent<HTMLElement, Event> | KeyboardEvent) => void;
	disabled?: boolean;
};

const useFolderActions = (folder: AccordionFolder): Array<FolderActionsProps> => {
	const [t] = useTranslation();
	const dispatch = useDispatch();

	const [activeModal, setActiveModal] = useState('default');
	const [activeGrant, setActiveGrant] = useState({});
	const goBack = useCallback(() => {
		setActiveModal('default');
	}, [setActiveModal]);

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
					const closeModal = getBridgedFunctions()?.createModal(
						{
							maxHeight: '90vh',
							children: (
								// eslint-disable-next-line @typescript-eslint/ban-ts-comment
								// @ts-ignore
								<NewModal folder={folder} onClose={(): void => closeModal()} />
							)
						},
						true
					);
				}
			},
			{
				id: FolderActionsType.MOVE,
				icon: 'MoveOutline',
				label: startsWith(folder.folder?.absFolderPath, '/Trash')
					? t('label.restore', 'Restore')
					: t('label.move', 'Move'),
				click: (e: SyntheticEvent<HTMLElement, Event> | KeyboardEvent): void => {
					if (e) {
						e.stopPropagation();
					}
					const closeModal = getBridgedFunctions()?.createModal(
						{
							maxHeight: '90vh',
							children: (
								// eslint-disable-next-line @typescript-eslint/ban-ts-comment
								// @ts-ignore
								<MoveModal folder={folder} onClose={(): void => closeModal()} />
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
				disabled: folder.folder?.n === 0 && folder.folder?.children?.length === 0,
				click: (e: SyntheticEvent<HTMLElement, Event> | KeyboardEvent): void => {
					if (e) {
						e.stopPropagation();
					}
					const closeModal = getBridgedFunctions()?.createModal(
						{
							// eslint-disable-next-line @typescript-eslint/ban-ts-comment
							// @ts-ignore
							children: <EmptyModal onClose={(): void => closeModal()} folder={folder} />
						},
						true
					);
				}
			},
			{
				id: FolderActionsType.EDIT,
				icon: 'Edit2Outline',
				label: folder?.folder?.isLink
					? t('folder_panel.action.edit_properties', 'Edit Properties')
					: t('label.edit', 'Edit'),
				click: (e: SyntheticEvent<HTMLElement, Event> | KeyboardEvent): void => {
					if (e) {
						e.stopPropagation();
					}
					const closeModal = getBridgedFunctions()?.createModal(
						{
							maxHeight: '90vh',
							// eslint-disable-next-line @typescript-eslint/ban-ts-comment
							// @ts-ignore
							children: <EditModal onClose={(): void => closeModal()} folder={folder} />
						},
						true
					);
				}
			},
			{
				id: FolderActionsType.DELETE,
				icon: 'Trash2Outline',
				label: startsWith(folder.folder?.absFolderPath, '/Trash')
					? t('label.delete_permanently', 'Delete Permanently')
					: t('label.delete', 'Delete'),
				click: (e: SyntheticEvent<HTMLElement, Event> | KeyboardEvent): void => {
					if (e) {
						e.stopPropagation();
					}
					const closeModal = getBridgedFunctions()?.createModal(
						{
							// eslint-disable-next-line @typescript-eslint/ban-ts-comment
							// @ts-ignore
							children: <DeleteModal onClose={(): void => closeModal()} folder={folder} />
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
					const closeModal = getBridgedFunctions()?.createModal(
						{
							children: (
								<>
									<ShareFolderModal
										// eslint-disable-next-line @typescript-eslint/ban-ts-comment
										// @ts-ignore
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
				click: (e: SyntheticEvent<HTMLElement, Event> | KeyboardEvent): void => {
					if (e) {
						e.stopPropagation();
						dispatch(folderAction({ folder: folder.folder, op: 'delete' }));
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
					const closeModal = getBridgedFunctions()?.createModal(
						{
							children: (
								// eslint-disable-next-line @typescript-eslint/ban-ts-comment
								// @ts-ignore
								<SharesInfoModal onClose={(): void => closeModal()} folder={folder.folder} />
							)
						},
						true
					);
				}
			}
		],
		[activeGrant, dispatch, folder, goBack, t]
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
			return folder.folder?.isLink
				? actions.filter(
						(action) =>
							action.id === FolderActionsType.SHARES_INFO ||
							action.id === FolderActionsType.REMOVE_FROM_LIST ||
							action.id === FolderActionsType.EDIT
				  )
				: defaultFolderActions.map((action) => {
						if (
							startsWith(folder.folder?.absFolderPath, '/Trash') &&
							(action.id === FolderActionsType.NEW || action.id === FolderActionsType.EDIT)
						) {
							return { ...action, disabled: true };
						}
						return action;
				  });
	}
};

type DragEnterAction =
	| undefined
	| {
			success: false;
	  };

type OnDropActionProps = {
	event: React.DragEvent;
	type: string;
	data: DataProps;
};

const badgeCount = (v?: number): number | undefined => (v && v > 0 ? v : undefined);

// TODO remove the "any" type after the Accordion refactor in the DS
export const AccordionCustomComponent: FC<{ item: any }> = ({ item }) => {
	const { folder } = item;
	const accountName = useUserAccount().name;
	const [t] = useTranslation();
	const dispatch = useDispatch();
	const { folderId } = useParams<{ folderId: string }>();

	const onDragEnterAction = (data: OnDropActionProps): DragEnterAction => {
		if (data.type === 'conversation' || data.type === 'message') {
			if (
				data.data.parentFolderId === folder.id || // same folder not allowed
				(data.data.parentFolderId === FOLDERS.INBOX && [5, 6].includes(Number(folder.id))) || // from inbox not allowed in draft and sent
				(data.data.parentFolderId === FOLDERS.DRAFTS && ![3].includes(Number(folder.id))) || // from draft only allowed in Trash
				(folder.id === FOLDERS.DRAFTS && data.data.parentFolderId !== FOLDERS.TRASH) || // only from Trash can move in Draft
				(folder.isLink && folder.perm?.indexOf('w') === -1) || // only if shared folder have write permission
				folder.id === FOLDERS.USER_ROOT ||
				folder.oname === ROOT_NAME
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
			dispatch(folderAction({ folder: data.data, l: folder.id || FOLDERS.USER_ROOT, op: 'move' }))
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				.then((res) => {
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
			)
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				.then((res) => {
					if (res.type.includes('fulfilled')) {
						replaceHistory(`/folder/${folderId}`);
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
			)
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				.then((res) => {
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
	const { zimbraPrefGroupMailBy } = useUserSettings().prefs;

	/* NOTE: Need to comment out when need to sort as per the configured sort order */
	// const { zimbraPrefSortOrder, zimbraPrefGroupMailBy } = useUserSettings().prefs;
	// const sorting = useMemo(() => {
	// 	if (typeof zimbraPrefSortOrder === 'string') {
	// 		return (
	// 			find(zimbraPrefSortOrder?.split(','), (f) => f?.split(':')?.[0] === folder.id)?.split(
	// 				':'
	// 			)?.[1] ?? 'dateDesc'
	// 		);
	// 	}
	// 	return 'dateDesc';
	// }, [zimbraPrefSortOrder, folder.id]) as 'dateDesc' | 'dateAsc';

	const onClick = useCallback((): void => {
		pushHistory(`/folder/${folder.id}`);
		dispatch(
			search({
				folderId: folder.id,
				limit: 101,
				sortBy: 'dateDesc',
				// folder.id === FOLDERS.DRAFTS ? 'message' : zimbraPrefGroupMailBy
				types:
					folder.id === FOLDERS.DRAFTS || typeof zimbraPrefGroupMailBy !== 'string'
						? 'message'
						: zimbraPrefGroupMailBy
			})
		);
	}, [dispatch, folder.id, zimbraPrefGroupMailBy]);

	const accordionItem = useMemo(
		() => ({
			...item,
			label:
				item.id === FOLDERS.USER_ROOT
					? accountName
					: getFolderTranslatedName({ t, folderId: item.id, folderName: item.label }),
			icon: getFolderIconName(item),
			iconColor: getFolderIconColor(item),
			// open: openIds ? openIds.includes(folder.id) : false,
			badgeCounter: badgeCount(item.id === FOLDERS.DRAFTS ? item?.folder.n : item?.folder?.u),
			badgeType: item.id === FOLDERS.DRAFTS ? 'read' : 'unread',
			to: `/folder/${item.id}`,
			textProps: { size: 'small' }
		}),
		[item, accountName, t]
	);

	const dropdownItems = useFolderActions(item);

	const statusIcon = useMemo(() => {
		const RowWithIcon = (icon: string, color: string, tooltipText: string): JSX.Element => (
			<Padding left="small">
				<Tooltip placement="right" label={tooltipText}>
					<Row>
						<Icon icon={icon} color={color} size="medium" />
					</Row>
				</Tooltip>
			</Padding>
		);

		if (folder.acl?.grant) {
			const tooltipText = t('tooltip.folder_sharing_status', {
				count: folder.acl.grant.length,
				defaultValue_one: 'Shared with {{count}} person',
				defaultValue: 'Shared with {{count}} people'
			});
			return RowWithIcon('Shared', 'shared', tooltipText);
		}
		if (folder.isLink) {
			const tooltipText = t('tooltip.folder_linked_status', 'Linked to me');
			return RowWithIcon('Linked', 'linked', tooltipText);
		}
		return '';
	}, [folder, t]);

	// hide folders where a share was provided and subsequently removed
	if (folder.broken) {
		return <></>;
	}

	return folder.id === FOLDERS.USER_ROOT || folder.oname === ROOT_NAME ? (
		<FittedRow>
			<Padding horizontal="small">
				<Avatar label={accordionItem.label} colorLabel={accordionItem.iconColor} size="medium" />
			</Padding>
			<Tooltip label={accordionItem.label} placement="right" maxWidth="100%">
				<AccordionItem item={accordionItem} />
			</Tooltip>
		</FittedRow>
	) : (
		<>
			<Drop
				acceptType={['message', 'conversation', 'folder']}
				onDrop={(data: DragObj): void => {
					onDropAction({
						type: data.type ?? '',
						data: data.data,
						event: data.event
					} as OnDropActionProps);
				}}
				onDragEnter={(data: DragObj): { success: boolean } | undefined =>
					onDragEnterAction({
						type: data.type ?? '',
						data: data.data,
						event: data.event
					} as OnDropActionProps)
				}
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
								<Padding left="small" />
								<Tooltip label={accordionItem.label} placement="right" maxWidth="100%">
									<AccordionItem item={accordionItem}>{statusIcon}</AccordionItem>
								</Tooltip>
							</Row>
						</Dropdown>
					</AppLink>
				</Drag>
			</Drop>
		</>
	);
};
