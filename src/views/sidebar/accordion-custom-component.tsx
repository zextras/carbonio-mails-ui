/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, useMemo } from 'react';

import styled from '@emotion/styled';
import {
	AccordionItem,
	Avatar,
	Container,
	Drag,
	DragObj,
	Drop,
	Icon,
	Padding,
	Row,
	Tooltip
} from '@zextras/carbonio-design-system';
import { t, useUserAccount } from '@zextras/carbonio-shell-ui';
import {
	Folder,
	FOLDERS,
	isRoot,
	isSystemFolder,
	OnDropActionProps,
	ROOT_NAME
} from '@zextras/carbonio-ui-commons';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { folderActionSoapApi } from 'api/folder-action-soap-api';
import { isDraft } from 'helpers/folders';
import { useOnMouseHover } from 'hooks/use-on-mouse-hover';
import { useUiUtilities } from 'hooks/use-ui-utilities';
import { convActionEmailStoreAction } from 'store/emails/actions/conv-action-action';
import { msgActionEmailStoreAction } from 'store/emails/actions/msg-action-action';
import StyledWrapper from 'styled-wrapper';
import { FolderActionWrapper } from 'views/sidebar/folder-action-wrapper';
import {
	folderHasChildren,
	getFolderIconColor,
	getFolderIconName,
	getFolderTranslatedName,
	getTotalUnreadCountInSubfolders,
	handleDragEnter
} from 'views/sidebar/utils';

const FittedRow = styled(Row)`
	max-width: calc(100% - (2 * ${({ theme }): string => theme.sizes.padding.small}));
	height: 3rem;
`;

export const DropOverlayContainer = styled(Container)<{ $folder: Folder }>`
	position: absolute;
	width: calc(15.5rem - ${({ $folder }): number => $folder.depth - 2}rem);
	height: 100%;
	background: ${({ theme }): string => theme.palette.primary.regular};
	border-radius: 0.25rem;
	border: 0.25rem solid #d5e3f6;
	opacity: 0.4;
`;

const DropDenyOverlayContainer = styled(Container)<{ $folder: Folder }>`
	position: absolute;
	width: calc(15.5rem - ${({ $folder }): number => $folder.depth - 2}rem);
	height: 100%;
	background: ${({ theme }): string => theme.palette.gray1.regular};
	border-radius: 0.25rem;
	border: 0.25rem solid #d5e3f6;
	opacity: 0.4;
`;

const badgeCount = (v?: number): number | undefined => (v && v > 0 ? v : undefined);

export const AccordionCustomComponent: FC<{ item: Folder }> = ({ item: folder }) => {
	const { ref, hasBeenHovered } = useOnMouseHover();
	const { displayName, name } = useUserAccount();
	const accountName = displayName ?? name;
	const { folderId } = useParams<{ folderId: string }>();
	const navigate = useNavigate();
	const { createSnackbar } = useUiUtilities();

	const onDropAction = (data: OnDropActionProps): void => {
		const dragEnterResponse = handleDragEnter(data, folder);
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
			folderActionSoapApi({
				folder: data.data,
				l: folder.id || FOLDERS.USER_ROOT,
				op: 'move'
			}).then((res) => {
				if (!('Fault' in res)) {
					createSnackbar({
						key: `move`,
						replace: true,
						severity: 'success',
						label: t('messages.snackbar.folder_moved', 'Folder successfully moved'),
						autoHideTimeout: 3000
					});
				} else {
					createSnackbar({
						key: `move`,
						replace: true,
						severity: 'error',
						label: t('label.error_try_again', 'Something went wrong, please try again.'),
						autoHideTimeout: 3000
					});
				}
			});
		} else if ('messageIds' in data.data) {
			convActionEmailStoreAction({
				operation: `move`,
				ids: convMsgsIds,
				parent: folder.id
			}).then((res) => {
				if (!('Fault' in res)) {
					navigate(`../folder/${folderId}`, { replace: true });
					data.data.deselectAll?.();
					createSnackbar({
						key: `edit`,
						replace: true,
						severity: 'info',
						label: t('messages.snackbar.conversation_move', 'Conversation successfully moved'),
						autoHideTimeout: 3000,
						actionLabel: t('action.goto_folder', 'GO TO FOLDER'),
						onActionClick: () => {
							navigate(`../folder/${folder.id}`, { replace: true });
						}
					});
				} else {
					createSnackbar({
						key: `edit`,
						replace: true,
						severity: 'error',
						label: t('label.error_try_again', 'Something went wrong, please try again'),
						autoHideTimeout: 3000,
						hideButton: true
					});
				}
			});
		} else {
			msgActionEmailStoreAction({
				operation: `move`,
				ids: convMsgsIds,
				parent: folder.id
			}).then((res) => {
				if (!('Fault' in res)) {
					data.data.deselectAll?.();
					createSnackbar({
						key: `edit`,
						replace: true,
						severity: 'info',
						label: t('messages.snackbar.message_move', 'Message successfully moved'),
						autoHideTimeout: 3000,
						actionLabel: t('action.goto_folder', 'GO TO FOLDER'),
						onActionClick: () => {
							navigate(`../folder/${folder.id}`, { replace: true });
						}
					});
				} else {
					createSnackbar({
						key: `edit`,
						replace: true,
						severity: 'error',
						label: t('label.error_try_again', 'Something went wrong, please try again'),
						autoHideTimeout: 3000,
						hideButton: true
					});
				}
			});
		}
	};

	const dragFolderDisable = useMemo(
		() => isSystemFolder(folder.id) || folder.isLink, // Default folders and shared folders not allowed to drag
		[folder.id, folder.isLink]
	);

	const badgeType: 'read' | 'unread' = useMemo(
		() => (isDraft(folder.id) ? 'read' : 'unread'),
		[folder.id]
	);

	const textProps: { size: 'small' } = useMemo(
		() => ({
			size: 'small'
		}),
		[]
	);

	const subfolderUnreadCount = useMemo(
		() => (folderHasChildren(folder) ? getTotalUnreadCountInSubfolders(folder) : 0),
		[folder]
	);

	const accordionItem = useMemo(() => {
		const hasSubfolderUnreads = subfolderUnreadCount > 0;

		let accountLevelBadgeCount: number | undefined;
		if (isRoot(folder.id)) {
			accountLevelBadgeCount = badgeCount(subfolderUnreadCount);
		} else {
			accountLevelBadgeCount = badgeCount(isDraft(folder.id) ? folder.n : folder?.u);
		}

		return {
			...folder,
			label:
				folder.id === FOLDERS.USER_ROOT
					? accountName
					: getFolderTranslatedName({ folderId: folder.id, folderName: folder.name }),
			icon: getFolderIconName(folder, hasSubfolderUnreads) ?? undefined,
			iconColor: getFolderIconColor(folder),
			badgeCounter: accountLevelBadgeCount,
			badgeType,
			to: `/folder/${folder.id}`,
			textProps
		};
	}, [folder, accountName, badgeType, textProps, subfolderUnreadCount]);

	const accordionItemToolTip = useMemo(() => {
		const folderLabel =
			folder.id === FOLDERS.USER_ROOT
				? accountName
				: getFolderTranslatedName({ folderId: folder.id, folderName: folder.name });

		const hasSubfolderUnread = subfolderUnreadCount > 0;

		if (isRoot(folder.id) && hasSubfolderUnread) {
			return `${folderLabel} (${t('tooltip.account_unread_count', {
				count: subfolderUnreadCount,
				defaultValue_one: '{{count}} unread mail',
				defaultValue: '{{count}} unread mails'
			})})`;
		}

		if (hasSubfolderUnread) {
			return `${folderLabel} (${t('tooltip.subfolder_unread_count', {
				count: subfolderUnreadCount,
				defaultValue_one: '{{count}} unread mail in subfolders',
				defaultValue: '{{count}} unread mails in subfolders'
			})})`;
		}

		return folderLabel;
	}, [folder, accountName, subfolderUnreadCount]);

	const statusIcon = useMemo(() => {
		const RowWithIcon = (icon: string, color: string, tooltipText: string): React.JSX.Element => (
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
	}, [folder.acl?.grant, folder.isLink]);

	// hide folders where a share was provided and subsequently removed
	if (folder.isLink && folder.broken) {
		return <></>;
	}

	if (folder.id === FOLDERS.USER_ROOT || (folder.isLink && folder.oname === ROOT_NAME))
		return (
			<FittedRow>
				<Padding left="small">
					<Avatar label={accordionItem.label} colorLabel={accordionItem.iconColor} size="medium" />
				</Padding>
				<Tooltip label={accordionItemToolTip} placement="right" maxWidth="100%">
					<AccordionItem data-testid={`accordion-folder-item-${folder.id}`} item={accordionItem} />
				</Tooltip>
			</FittedRow>
		);

	return (
		<StyledWrapper>
			<Row width="fill" minWidth={0} ref={ref}>
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
						handleDragEnter(
							{
								type: data.type ?? '',
								data: data.data,
								event: data.event
							} as OnDropActionProps,
							folder
						)
					}
					overlayAcceptComponent={<DropOverlayContainer $folder={folder} />}
					overlayDenyComponent={<DropDenyOverlayContainer $folder={folder} />}
				>
					<Drag
						type="folder"
						data={folder}
						dragDisabled={dragFolderDisable}
						style={{ display: 'block' }}
					>
						<Link
							to={`../folder/${folder.id}`}
							style={{ width: '100%', height: '100%', textDecoration: 'none' }}
						>
							{hasBeenHovered ? (
								<FolderActionWrapper folder={folder}>
									<Tooltip label={accordionItemToolTip} placement="right" maxWidth="100%">
										<AccordionItem
											data-testid={`accordion-folder-item-${folder.id}`}
											item={accordionItem}
										>
											{statusIcon}
										</AccordionItem>
									</Tooltip>
								</FolderActionWrapper>
							) : (
								<Container padding={{ left: 'small' }}>
									<Tooltip label={accordionItemToolTip} placement="right" maxWidth="100%">
										<AccordionItem
											data-testid={`accordion-folder-item-${folder.id}`}
											item={accordionItem}
										>
											{statusIcon}
										</AccordionItem>
									</Tooltip>
								</Container>
							)}
						</Link>
					</Drag>
				</Drop>
			</Row>
		</StyledWrapper>
	);
};
