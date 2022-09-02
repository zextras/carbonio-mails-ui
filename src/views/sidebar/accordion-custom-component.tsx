/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import {
	AccordionItem,
	Avatar,
	Container,
	Drag,
	Drop,
	Dropdown,
	Icon,
	Padding,
	Row,
	Tooltip
} from '@zextras/carbonio-design-system';
import {
	AppLink,
	Folder,
	FOLDERS,
	getBridgedFunctions,
	pushHistory,
	replaceHistory,
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore
	ROOT_NAME,
	useUserAccount,
	useUserSettings
} from '@zextras/carbonio-shell-ui';
import React, { FC, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';
import { convAction, msgAction, search } from '../../store/actions';
import { folderAction } from '../../store/actions/folder-action';
import { DataProps } from '../../types';
import { useFolderActions } from './use-folder-actions';
import { getFolderIconColor, getFolderIconName, getFolderTranslatedName } from './utils';

const FittedRow = styled(Row)`
	max-width: calc(100% - (2 * ${({ theme }): string => theme.sizes.padding.small}));
	height: 48px;
`;

export const DropOverlayContainer = styled(Container)`
	position: absolute;
	width: calc(248px - ${(props): number => (props.folder.level - 2) * 16}px);
	height: 100%;
	background: ${(props): string => props.theme.palette.primary.regular};
	border-radius: 4px;
	border: 4px solid #d5e3f6;
	opacity: 0.4;
`;
export const DropDenyOverlayContainer = styled(Container)`
	position: absolute;
	width: calc(248px - ${(props): number => (props.folder.level - 2) * 16}px);
	height: 100%;
	background: ${(props): string => props.theme.palette.gray1.regular};
	border-radius: 4px;
	border: 4px solid #d5e3f6;
	opacity: 0.4;
`;
export type DragEnterAction =
	| undefined
	| {
			success: false;
	  };
export type OnDropActionProps = {
	type: string;
	data: DataProps;
};

const badgeCount = (v?: number): number | undefined => (v && v > 0 ? v : undefined);

const AccordionCustomComponent: FC<{ item: Folder }> = ({ item }) => {
	const accountName = useUserAccount().name;
	const [t] = useTranslation();
	const dispatch = useDispatch();
	const { folderId } = useParams<{ folderId: string }>();

	const onDragEnterAction = useCallback(
		(data: OnDropActionProps): DragEnterAction => {
			if (data.type === 'conversation' || data.type === 'message') {
				if (
					data.data.parentFolderId === item.id || // same folder not allowed
					(data.data.parentFolderId === FOLDERS.INBOX && [5, 6].includes(Number(item.id))) || // from inbox not allowed in draft and sent
					(data.data.parentFolderId === FOLDERS.DRAFTS && ![3].includes(Number(item.id))) || // from draft only allowed in Trash
					(item.id === FOLDERS.DRAFTS && data.data.parentFolderId !== FOLDERS.TRASH) || // only from Trash can move in Draft
					(item.isLink && item.perm?.indexOf('w') === -1) || // only if shared folder have write permission
					item.id === FOLDERS.USER_ROOT ||
					(item.isLink && item.oname === ROOT_NAME)
				) {
					return { success: false };
				}
			}
			if (data.type === 'folder') {
				if (
					item.id === data.data.id || // same folder not allowed
					item.isLink || //  shared folder not allowed
					[FOLDERS.DRAFTS, FOLDERS.SPAM].includes(item.id) // cannot be moved inside Draft and Spam
				)
					return { success: false };
			}
			return undefined;
		},
		[item]
	);

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
			dispatch(folderAction({ folder: data.data, l: item.id || FOLDERS.USER_ROOT, op: 'move' }))
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
					parent: item.id
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
								replaceHistory(`/folder/${item.id}`);
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
					parent: item.id
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
								replaceHistory(`/folder/${item.id}`);
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
				item.id
			) || item.isLink, // Default folders and shared folders not allowed to drag
		[item.id, item.isLink]
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
		pushHistory(`/folder/${item.id}`);
		dispatch(
			search({
				folderId: item.id,
				limit: 101,
				sortBy: 'dateDesc',
				// folder.id === FOLDERS.DRAFTS ? 'message' : zimbraPrefGroupMailBy
				types:
					item.id === FOLDERS.DRAFTS || typeof zimbraPrefGroupMailBy !== 'string'
						? 'message'
						: zimbraPrefGroupMailBy
			})
		);
	}, [dispatch, item.id, zimbraPrefGroupMailBy]);

	const accordionItem = useMemo(
		() => ({
			...item,
			label:
				item.id === FOLDERS.USER_ROOT
					? accountName
					: getFolderTranslatedName({ t, folderId: item.id, folderName: item.name }),
			icon: getFolderIconName(item),
			iconColor: getFolderIconColor(item),
			// open: openIds ? openIds.includes(folder.id) : false,
			badgeCounter: badgeCount(item.id === FOLDERS.DRAFTS ? item?.n : item?.u),
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
						<Icon icon={icon} color={color} size="large" />
					</Row>
				</Tooltip>
			</Padding>
		);

		if (item.acl?.grant) {
			const tooltipText = t('tooltip.folder_sharing_status', {
				count: item.acl.grant.length,
				defaultValue_one: 'Shared with {{count}} person',
				defaultValue: 'Shared with {{count}} people'
			});
			return RowWithIcon('Shared', 'shared', tooltipText);
		}
		if (item.isLink) {
			const tooltipText = t('tooltip.folder_linked_status', 'Linked to me');
			return RowWithIcon('Linked', 'linked', tooltipText);
		}
		return '';
	}, [item, t]);

	// hide folders where a share was provided and subsequently removed
	if (item.isLink && item.broken) {
		return <></>;
	}

	return item.id === FOLDERS.USER_ROOT || (item.isLink && item.oname === ROOT_NAME) ? (
		<FittedRow>
			<Padding left="small">
				<Avatar label={accordionItem.label} colorLabel={accordionItem.iconColor} size="medium" />
			</Padding>
			<Tooltip label={accordionItem.label} placement="right" maxWidth="100%">
				<AccordionItem item={accordionItem} />
			</Tooltip>
		</FittedRow>
	) : (
		<Row width="fill" minWidth={0}>
			<Drop
				acceptType={['message', 'conversation', 'folder']}
				onDrop={(data: OnDropActionProps): void => onDropAction(data)}
				onDragEnter={(data: OnDropActionProps): unknown => onDragEnterAction(data)}
				overlayAcceptComponent={<DropOverlayContainer folder={item} />}
				overlayDenyComponent={<DropDenyOverlayContainer folder={item} />}
			>
				<Drag
					type="folder"
					data={item}
					dragDisabled={dragFolderDisable}
					style={{ display: 'block' }}
				>
					<AppLink
						onClick={onClick}
						to={`/folder/${item.id}`}
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
		</Row>
	);
};

export default AccordionCustomComponent;
