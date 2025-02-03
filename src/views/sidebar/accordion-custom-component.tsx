/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, useCallback, useMemo } from 'react';

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
import {
	AppLink,
	pushHistory,
	replaceHistory,
	t,
	useUserAccount
} from '@zextras/carbonio-shell-ui';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';

import { FolderActionWrapper } from './folder-action-wrapper';
import { getFolderIconColor, getFolderIconName, getFolderTranslatedName } from './utils';
import { folderActionSoapApi } from '../../api/folder-action-soap-api';
import { ROOT_NAME } from '../../carbonio-ui-commons/constants';
import { FOLDERS } from '../../carbonio-ui-commons/constants/folders';
import { isSystemFolder } from '../../carbonio-ui-commons/helpers/folders';
import type { Folder } from '../../carbonio-ui-commons/types/folder';
import type { DragEnterAction, OnDropActionProps } from '../../carbonio-ui-commons/types/sidebar';
import { isDraft, isSpam } from '../../helpers/folders';
import { useOnMouseHover } from '../../hooks/use-on-mouse-hover';
import { useUiUtilities } from '../../hooks/use-ui-utilities';
import { convActionEmailStoreAction } from '../../store/emails/actions/conv-action-action';
import { msgActionEmailStoreAction } from '../../store/emails/actions/msg-action-action';

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

const AccordionCustomComponent: FC<{ item: Folder }> = ({ item: folder }) => {
	const { ref, hasBeenHovered } = useOnMouseHover();
	const accountName = useUserAccount().name;
	const { folderId } = useParams<{ folderId: string }>();
	const { createSnackbar } = useUiUtilities();

	const onDragEnterAction = useCallback(
		(data: OnDropActionProps): DragEnterAction => {
			if (data.type === 'conversation' || data.type === 'message') {
				if (
					data.data.parentFolderId === folder.id || // same folder not allowed
					(data.data.parentFolderId === FOLDERS.INBOX && [5, 6].includes(Number(folder.id))) || // from inbox not allowed in draft and sent
					(data.data.parentFolderId === FOLDERS.DRAFTS && ![3].includes(Number(folder.id))) || // from draft only allowed in Trash
					(folder.id === FOLDERS.DRAFTS && data.data.parentFolderId !== FOLDERS.TRASH) || // only from Trash can move in Draft
					(folder.isLink && folder.perm?.indexOf('w') === -1) || // only if shared folder have write permission
					folder.id === FOLDERS.USER_ROOT ||
					(folder.isLink && folder.oname === ROOT_NAME)
				) {
					return { success: false };
				}
			}
			if (data.type === 'folder') {
				if (
					folder.id === data.data.id || // same folder not allowed
					folder.isLink || //  shared folder not allowed
					isDraft(folder.id) ||
					isSpam(folder.id) // cannot be moved inside Draft and Spam
				)
					return { success: false };
			}
			return undefined;
		},
		[folder]
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
					replaceHistory(`/folder/${folderId}`);
					data.data.deselectAll && data.data.deselectAll();
					createSnackbar({
						key: `edit`,
						replace: true,
						severity: 'info',
						label: t('messages.snackbar.conversation_move', 'Conversation successfully moved'),
						autoHideTimeout: 3000,
						actionLabel: t('action.goto_folder', 'GO TO FOLDER'),
						onActionClick: () => {
							replaceHistory(`/folder/${folder.id}`);
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
					data.data.deselectAll && data.data.deselectAll();
					createSnackbar({
						key: `edit`,
						replace: true,
						severity: 'info',
						label: t('messages.snackbar.message_move', 'Message successfully moved'),
						autoHideTimeout: 3000,
						actionLabel: t('action.goto_folder', 'GO TO FOLDER'),
						onActionClick: () => {
							replaceHistory(`/folder/${folder.id}`);
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

	const onClick = useCallback((): void => {
		pushHistory(`/folder/${folder.id}`);
	}, [folder.id]);

	const badgeType: 'read' | 'unread' = useMemo(
		() => (folder.id && folder.id === FOLDERS.DRAFTS ? 'read' : 'unread'),
		[folder.id]
	);

	const textProps: { size: 'small' } = useMemo(
		() => ({
			size: 'small'
		}),
		[]
	);
	const accordionItem = useMemo(
		() => ({
			...folder,
			label:
				folder.id === FOLDERS.USER_ROOT
					? accountName
					: (getFolderTranslatedName({ folderId: folder.id, folderName: folder.name }) ?? ''),
			icon: getFolderIconName(folder) ?? undefined,
			iconColor: getFolderIconColor(folder) ?? '',
			badgeCounter: badgeCount(folder.id === FOLDERS.DRAFTS ? folder.n : folder?.u),
			badgeType,
			to: `/folder/${folder.id}`,
			textProps
		}),
		[folder, accountName, badgeType, textProps]
	);

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
				<Tooltip label={accordionItem.label} placement="right" maxWidth="100%">
					<AccordionItem data-testid={`accordion-folder-item-${folder.id}`} item={accordionItem} />
				</Tooltip>
			</FittedRow>
		);

	return (
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
					onDragEnterAction({
						type: data.type ?? '',
						data: data.data,
						event: data.event
					} as OnDropActionProps)
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
					<AppLink
						onClick={onClick}
						to={`/folder/${folder.id}`}
						style={{ width: '100%', height: '100%', textDecoration: 'none' }}
					>
						{hasBeenHovered ? (
							<FolderActionWrapper folder={folder}>
								<Tooltip label={accordionItem.label} placement="right" maxWidth="100%">
									<AccordionItem
										data-testid={`accordion-folder-item-${folder.id}`}
										item={accordionItem}
									>
										{statusIcon}
									</AccordionItem>
								</Tooltip>
							</FolderActionWrapper>
						) : (
							<Tooltip label={accordionItem.label} placement="right" maxWidth="100%">
								<AccordionItem
									data-testid={`accordion-folder-item-${folder.id}`}
									item={accordionItem}
								>
									{statusIcon}
								</AccordionItem>
							</Tooltip>
						)}
					</AppLink>
				</Drag>
			</Drop>
		</Row>
	);
};

export default AccordionCustomComponent;
