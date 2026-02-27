/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { ReactElement, useCallback, useMemo, useRef, useState } from 'react';

import { useUserSettings } from '@zextras/carbonio-shell-ui';
import { CustomListItem, FOLDERS } from '@zextras/carbonio-ui-commons';
import { map } from 'lodash';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';

import { MessageShortcutsRegister } from './message-shortcuts-register';
import { parseMessageSortingOptions } from '../../../../helpers/parseMessageSortingOptions';
import type { FolderPanelRouteParams } from '../../../../types/routes';
import { API_REQUEST_STATUS, LIST_LIMIT } from 'constants/index';
import { getFolderIdParts } from 'helpers/folders';
import { useFetchMessagesByFolder } from 'hooks/use-fetch-messages-by-folder';
import { useMultipleSelection } from 'hooks/use-multiple-selection';
import { SortBy } from 'types/sorting';
import { MessageListComponent } from 'views/app/folder-panel/messages/message-list-component';
import { useLoadMoreForMessageList } from 'views/app/folder-panel/messages/message-list-hooks';
import { MessageListItemComponent } from 'views/app/folder-panel/messages/message-list-item-component';

export const MessageList = (): React.JSX.Element => {
	const [t] = useTranslation();
	const { itemId, folderId } = useParams<FolderPanelRouteParams>() as FolderPanelRouteParams;
	const loadingMore = useRef<boolean>(false);
	const dragImageRef = useRef(null);
	const [draggedIds, setDraggedIds] = useState<Record<string, boolean>>({});
	const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
	const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);

	const { messageIndexSlice } = useFetchMessagesByFolder(folderId);
	const { messageListIndex, status } = messageIndexSlice;

	const { prefs } = useUserSettings();
	const { sortType, sortDirection, filterType } = useMemo(
		() => parseMessageSortingOptions(folderId, prefs.zimbraPrefSortOrder as string),
		[folderId, prefs.zimbraPrefSortOrder]
	);
	const sortOrder = useMemo<SortBy>(() => `${sortType}${sortDirection}`, [sortDirection, sortType]);

	const {
		deselectAll,
		isSelectModeOn,
		setIsSelectModeOn,
		selectAll,
		isAllSelected,
		selectAllModeOff,
		selectRange
	} = useMultipleSelection({
		lastSelectedIndex,
		setLastSelectedIndex,
		selectedItems,
		setSelectedItems,
		allAvailableItems: messageListIndex
	});

	const hasMore = messageIndexSlice.more;

	const loadMoreCallback = useLoadMoreForMessageList({
		folderId,
		loadingMore,
		hasMore,
		sortBy: sortOrder,
		offset: messageListIndex.length,
		limit: LIST_LIMIT.LOAD_MORE_LIMIT,
		filterType
	});

	const displayerTitle = useMemo(() => {
		if (messageListIndex?.length === 0) {
			if (getFolderIdParts(folderId).id === FOLDERS.SPAM) {
				return t('displayer.list_spam_title', 'There are no spam e-mails');
			}
			if (getFolderIdParts(folderId).id === FOLDERS.SENT) {
				return t('displayer.list_sent_title', 'You haven’t sent any e-mail yet');
			}
			if (getFolderIdParts(folderId).id === FOLDERS.DRAFTS) {
				return t('displayer.list_draft_title', 'There are no saved drafts');
			}
			if (getFolderIdParts(folderId).id === FOLDERS.TRASH) {
				return t('displayer.list_trash_title', 'The trash is empty');
			}
			return t('displayer.list_folder_title', 'It looks like there are no e-mails yet');
		}
		return null;
	}, [messageListIndex?.length, folderId, t]);

	const onMessagesMoved = useCallback((movedMessagesIds: Array<string>): void => {
		// Deselect moved messages
		setSelectedItems((prevSelectedItems) => {
			const newSelectedItems = new Set(prevSelectedItems);
			movedMessagesIds.forEach((id) => {
				newSelectedItems.delete(id);
			});
			return newSelectedItems;
		});
	}, []);

	const selectedItemsMap: Record<string, boolean> = Object.fromEntries(
		Array.from(selectedItems, (item) => [item, true])
	);

	const selectedIdsArray = useMemo(() => Array.from(selectedItems), [selectedItems]);
	const keyboardShortcutsIds =
		selectedItems.size > 0 ? selectedIdsArray : ([itemId].filter(Boolean) as Array<string>);

	const listItems = useMemo(
		() =>
			map(messageListIndex, (id, index) => {
				const isSelected = selectedItems.has(id);
				const active = itemId === id;

				return (
					<CustomListItem
						data-testid={`message-item-${id}`}
						key={id}
						selected={isSelected}
						active={active}
						background={'transparent'}
					>
						{(visible: boolean): ReactElement =>
							visible ? (
								<>
									{(active || isSelected) && (
										<MessageShortcutsRegister
											messageIds={keyboardShortcutsIds}
											folderId={folderId}
										/>
									)}
									<MessageListItemComponent
										deselectAll={deselectAll}
										messageId={id}
										selectedItems={selectedItemsMap}
										isSelected={isSelected}
										active={active}
										isSelectModeOn={isSelectModeOn}
										dragImageRef={dragImageRef}
										draggedIds={draggedIds}
										key={id}
										visible={visible}
										setDraggedIds={setDraggedIds}
										currentFolderId={folderId}
										index={index}
										onSelect={selectRange}
									/>
								</>
							) : (
								<div style={{ height: '4rem' }} data-testid="invisible-item" />
							)
						}
					</CustomListItem>
				);
			}),
		[
			deselectAll,
			draggedIds,
			folderId,
			isSelectModeOn,
			itemId,
			keyboardShortcutsIds,
			messageListIndex,
			selectRange,
			selectedItems,
			selectedItemsMap
		]
	);

	const totalMessages = useMemo(() => messageListIndex.length, [messageListIndex.length]);

	const messagesLoadingCompleted = useMemo(() => status === API_REQUEST_STATUS.fulfilled, [status]);

	return (
		<MessageListComponent
			totalMessages={totalMessages}
			displayerTitle={displayerTitle}
			listItems={listItems}
			loadMoreCallback={hasMore ? loadMoreCallback : undefined}
			messagesLoadingCompleted={messagesLoadingCompleted}
			selectedIds={selectedIdsArray}
			folderId={folderId}
			messageIds={messageListIndex}
			draggedIds={draggedIds}
			isSelectModeOn={isSelectModeOn}
			setIsSelectModeOn={setIsSelectModeOn}
			isAllSelected={isAllSelected}
			selectAll={selectAll}
			deselectAll={deselectAll}
			selectAllModeOff={selectAllModeOff}
			dragImageRef={dragImageRef}
			onMessagesMoved={onMessagesMoved}
		/>
	);
};
