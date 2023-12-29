/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, ReactElement, SyntheticEvent, useCallback, useEffect, useState } from 'react';

import {
	Button,
	Container,
	Dropdown,
	IconButton,
	Row,
	Tooltip
} from '@zextras/carbonio-design-system';
import { FOLDERS, t, useTags } from '@zextras/carbonio-shell-ui';
import { every, filter, findIndex, some } from 'lodash';

import {
	useDeleteConversationPermanently,
	useMoveConversationToFolder,
	useMoveConversationToTrash,
	setConversationsFlag,
	setConversationsRead,
	useSetConversationAsSpam
} from './conversation-actions';
import {
	useDeleteMessagePermanently,
	useMoveMessageToFolder,
	useMoveMsgToTrash,
	setMsgFlag,
	setMsgRead,
	useSetMsgAsSpam
} from './message-actions';
import { applyMultiTag } from './tag-actions';
import { getFolderParentId } from './utils';
import { getFolderIdParts } from '../helpers/folders';
import { useAppDispatch } from '../hooks/redux';
import { useUiUtilities } from '../hooks/use-ui-utilities';
import type {
	ActionReturnType,
	ConvActionReturnType,
	Conversation,
	MailMessage,
	MessageActionReturnType,
	TagActionItemType
} from '../types';

type MultipleSelectionActionsPanelProps = {
	items: Array<Partial<MailMessage> & Pick<MailMessage, 'id'>> | Array<Conversation>;
	selectedIds: Array<string>;
	deselectAll: () => void;
	selectAll: () => void;
	isAllSelected: boolean;
	selectAllModeOff: () => void;
	setIsSelectModeOn: (value: boolean) => void;
	folderId: string;
};
type MsgOrConv = (Partial<MailMessage> & Pick<MailMessage, 'id'>) | Conversation;

export const MultipleSelectionActionsPanel: FC<MultipleSelectionActionsPanelProps> = ({
	items,
	selectedIds,
	deselectAll,
	selectAll,
	isAllSelected,
	selectAllModeOff,
	setIsSelectModeOn,
	folderId
}) => {
	const { createSnackbar } = useUiUtilities();
	const isConversation = 'messages' in (items?.[0] || {});

	const folderParentId = getFolderParentId({ folderId, isConversation, items });

	const [currentFolderId] = useState(folderParentId);

	// This useEffect is required to reset the select mode when the user navigates to a different folder
	useEffect(() => {
		if (folderId && currentFolderId !== folderParentId) {
			deselectAll();
			setIsSelectModeOn(false);
		}
	}, [currentFolderId, deselectAll, folderId, folderParentId, setIsSelectModeOn]);

	const dispatch = useAppDispatch();
	const ids = Object.values(selectedIds ?? []);
	const selectedConversation = filter(items, (item: MsgOrConv) => ids.includes(item.id ?? '0'));
	const tags = useTags();
	const foldersExcludedMarkReadUnread = [FOLDERS.DRAFTS, FOLDERS.SPAM, FOLDERS.TRASH];
	const foldersExcludedTrash = [FOLDERS.TRASH];
	const foldersIncludedDeletePermanently = [FOLDERS.TRASH];
	const foldersExcludedMoveToFolder = [FOLDERS.DRAFTS, FOLDERS.TRASH];
	const foldersExcludedTags = [FOLDERS.SPAM];
	const foldersExcludedMarkSpam = [FOLDERS.DRAFTS, FOLDERS.TRASH, FOLDERS.SPAM];
	const foldersIncludedMarkNotSpam = [FOLDERS.SPAM];

	const addFlagAction = (): ActionReturnType => {
		const selectedItems = filter(items, (item: MsgOrConv) => ids.includes(item.id ?? '0'));
		const action = isConversation
			? setConversationsFlag({ ids, value: false, dispatch })
			: setMsgFlag({ ids, value: false, dispatch });
		return !some(selectedItems, ['flagged', true]) && action;
	};

	const removeFlagAction = (): ActionReturnType => {
		const selectedItems = filter(items, (item: MsgOrConv) => ids.includes(item.id ?? '0'));
		const action = isConversation
			? setConversationsFlag({ ids, value: true, dispatch })
			: setMsgFlag({ ids, value: true, dispatch });
		return every(selectedItems, ['flagged', true]) && action;
	};

	const setMsgReadAction = (): ActionReturnType => {
		const selectedItems = filter(
			items,
			(item: MsgOrConv) =>
				ids.includes(item.id ?? '0') &&
				!foldersExcludedMarkReadUnread.includes(getFolderIdParts(folderParentId).id ?? '0')
		);
		const action = isConversation
			? setConversationsRead({
					ids,
					value: false,
					dispatch,
					folderId,
					deselectAll,
					shouldReplaceHistory: false
			  })
			: setMsgRead({ ids, value: false, dispatch, folderId: folderParentId });
		return findIndex(selectedItems, ['read', false]) !== -1 && action;
	};

	const setMsgUnreadAction = (): ActionReturnType => {
		const selectedItems = filter(
			items,
			(item: MsgOrConv) =>
				ids.includes(item.id ?? '0') &&
				!foldersExcludedMarkReadUnread.includes(getFolderIdParts(folderParentId).id ?? '0')
		);
		const action = isConversation
			? setConversationsRead({
					ids,
					value: true,
					dispatch,
					folderId,
					deselectAll,
					shouldReplaceHistory: false
			  })
			: setMsgRead({ ids, value: true, dispatch, folderId: folderParentId });
		return selectedItems.length > 0 && every(selectedItems, ['read', true]) && action;
	};

	const moveConversationToTrash = useMoveConversationToTrash();
	const moveMsgToTrash = useMoveMsgToTrash();
	const getMoveToTrashAction = (): false | ConvActionReturnType | MessageActionReturnType => {
		const selectedItems = filter(
			items,
			(item: MsgOrConv) =>
				ids.includes(item.id ?? '0') &&
				!foldersExcludedTrash.includes(getFolderIdParts(folderParentId).id ?? '0')
		);
		const action = isConversation
			? moveConversationToTrash({ ids, dispatch, folderId, deselectAll })
			: moveMsgToTrash({ ids, dispatch, deselectAll });
		return selectedItems.length > 0 && selectedItems.length === ids.length && action;
	};

	const deleteConversationPermanently = useDeleteConversationPermanently();
	const deleteMessagePermanently = useDeleteMessagePermanently();
	const deletePermanentlyAction = (): ActionReturnType => {
		const selectedItems = filter(
			items,
			(item: MsgOrConv) =>
				ids.includes(item.id ?? '0') &&
				foldersIncludedDeletePermanently.includes(getFolderIdParts(folderParentId).id ?? '0')
		);
		const action = isConversation
			? deleteConversationPermanently({ ids, deselectAll })
			: deleteMessagePermanently({ ids, dispatch, deselectAll });
		return selectedItems.length > 0 && selectedItems.length === ids.length && action;
	};

	const moveConversationToFolder = useMoveConversationToFolder();
	const moveMessageToFolder = useMoveMessageToFolder();
	const moveToFolderAction = (): ActionReturnType => {
		const selectedItems = filter(
			items,
			(item: MsgOrConv) =>
				ids.includes(item.id ?? '0') &&
				!foldersExcludedMoveToFolder.includes(getFolderIdParts(folderParentId).id ?? '0')
		);
		const action = isConversation
			? moveConversationToFolder({
					ids,
					dispatch,
					folderId,
					isRestore: false,
					deselectAll
			  })
			: moveMessageToFolder({
					id: ids,
					folderId: folderParentId,
					dispatch,
					isRestore: false,
					deselectAll
			  });
		return selectedItems.length > 0 && selectedItems.length === ids.length && action;
	};

	const applyTagAction = (): false | TagActionItemType => {
		const selectedItems = filter(
			items,
			(item: MsgOrConv) =>
				ids.includes(item.id ?? '0') &&
				!foldersExcludedTags.includes(getFolderIdParts(folderParentId).id ?? '0')
		);
		const action = applyMultiTag({
			ids,
			tags,
			conversations: selectedConversation,
			folderId: folderParentId,
			deselectAll,
			isMessage: !isConversation
		});
		return selectedItems.length > 0 && selectedItems.length === ids.length && action;
	};

	const setConversationAsSpam = useSetConversationAsSpam();
	const setMsgAsSpam = useSetMsgAsSpam();
	const markMsgAsSpam = (): ActionReturnType => {
		const selectedItems = filter(
			items,
			(item: MsgOrConv) =>
				ids.includes(item.id ?? '0') &&
				!foldersExcludedMarkSpam.includes(getFolderIdParts(folderParentId).id ?? '0')
		);
		const action = isConversation
			? setConversationAsSpam({
					ids,
					value: false,
					dispatch,
					deselectAll
			  })
			: setMsgAsSpam({ ids, value: false, dispatch, folderId: folderParentId });

		return selectedItems.length > 0 && selectedItems.length === ids.length && action;
	};

	const markMsgAsNotSpam = (): ActionReturnType => {
		const selectedItems = filter(
			items,
			(item: MsgOrConv) =>
				ids.includes(item.id ?? '0') &&
				foldersIncludedMarkNotSpam.includes(getFolderIdParts(folderParentId).id ?? '0')
		);
		const action = isConversation
			? setConversationAsSpam({
					ids,
					value: true,
					dispatch,
					deselectAll
			  })
			: setMsgAsSpam({ ids, value: true, dispatch, folderId: folderParentId });

		return selectedItems.length > 0 && selectedItems.length === ids.length && action;
	};

	const messagesArrayIsNotEmpty = ids.length > 0;

	const primaryActions = (): ActionReturnType[] => {
		if (messagesArrayIsNotEmpty)
			return [
				setMsgReadAction(),
				setMsgUnreadAction(),
				getMoveToTrashAction(),
				deletePermanentlyAction()
			];
		return [];
	};

	const secondaryActions = (): ActionReturnType[] => {
		if (messagesArrayIsNotEmpty)
			return [
				setMsgReadAction(),
				setMsgUnreadAction(),
				addFlagAction(),
				removeFlagAction(),
				moveToFolderAction(),
				applyTagAction(),
				markMsgAsSpam(),
				markMsgAsNotSpam()
			];
		return [];
	};

	const primaryActionsArray = primaryActions()?.reduce((acc, action) => {
		if (action)
			acc.push(
				<div key={action.id}>
					<Tooltip label={'label' in action ? action.label : ''} maxWidth="100%">
						<IconButton
							data-testid={`primary-multi-action-button-${action.id}`}
							icon={'icon' in action ? action.icon : ''}
							iconColor="primary"
							onClick={(ev: KeyboardEvent | SyntheticEvent<HTMLElement, Event>): void => {
								if (ev) ev.preventDefault();
								action.onClick && action.onClick(ev);
							}}
							size="large"
						/>
					</Tooltip>
				</div>
			);
		return acc;
	}, [] as Array<ReactElement>);

	const secondaryActionsArray: Array<Exclude<ActionReturnType, false> & { label: string }> =
		secondaryActions()?.reduce((acc, action) => {
			if (action)
				acc.push({
					id: 'label' in action ? action.label : action.id,
					icon: 'icon' in action ? action.icon : '',
					label: 'label' in action ? action.label : '',
					onClick: (ev?: KeyboardEvent | SyntheticEvent<HTMLElement, Event>): void => {
						if (ev) ev.preventDefault();
						action.onClick && action.onClick(ev);
					},
					customComponent: action.customComponent,
					items: action.items
				});
			return acc;
		}, [] as Array<Exclude<ActionReturnType, false> & { label: string }>);

	const arrowBackOnClick = useCallback(() => {
		deselectAll();
		setIsSelectModeOn(false);
	}, [deselectAll, setIsSelectModeOn]);

	const selectAllOnClick = useCallback(() => {
		selectAll();
		createSnackbar({
			key: `selected-${ids}`,
			replace: true,
			type: 'info',
			label: t('label.all_items_selected', 'All visible items have been selected'),
			autoHideTimeout: 5000,
			hideButton: true
		});
	}, [selectAll, createSnackbar, ids]);

	const actionsIsNotEmpty = primaryActionsArray.length > 0 || secondaryActionsArray.length > 0;

	const iconButtonTooltip = t('label.exit_selection_mode', 'Exit selection mode');

	return (
		<Container
			background="gray5"
			height="3rem"
			orientation="horizontal"
			padding={{ all: 'extrasmall' }}
			mainAlignment="flex-start"
			width="100%"
		>
			<Row
				height="100%"
				width="fill"
				padding={{ all: 'extrasmall' }}
				mainAlignment="space-between"
				takeAvailableSpace
			>
				<Row mainAlignment="flex-start" width="fit" padding={{ right: 'medium' }}>
					<Tooltip label={iconButtonTooltip}>
						<IconButton
							icon="ArrowBack"
							iconColor="primary"
							size="large"
							onClick={arrowBackOnClick}
							data-testid="action-button-deselect-all"
						/>
					</Tooltip>
					<Button
						type="ghost"
						label={
							isAllSelected
								? t('label.deselect_all', 'DESELECT all')
								: t('label.select_all', 'SELECT all')
						}
						color="primary"
						onClick={isAllSelected ? selectAllModeOff : selectAllOnClick}
					/>
				</Row>
				{actionsIsNotEmpty && (
					<Row mainAlignment="flex-end" width="fit">
						{primaryActionsArray}

						<Dropdown
							placement="right-end"
							data-testid="secondary-actions-dropdown"
							items={secondaryActionsArray}
						>
							<IconButton
								size="large"
								iconColor="primary"
								icon="MoreVertical"
								data-testid="secondary-actions-open-button"
								onClick={(): null => null}
							/>
						</Dropdown>
					</Row>
				)}
			</Row>
		</Container>
	);
};
