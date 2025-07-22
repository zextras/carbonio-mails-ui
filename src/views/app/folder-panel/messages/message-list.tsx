/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { ReactElement, useMemo, useRef, useState } from 'react';

import { useUserSettings } from '@zextras/carbonio-shell-ui';
import { CustomListItem, FOLDERS } from '@zextras/carbonio-ui-commons';
import { map } from 'lodash';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';

import { API_REQUEST_STATUS, LIST_LIMIT } from 'constants/index';
import { getFolderIdParts } from 'helpers/folders';
import { parseMessageSortingOptions } from 'helpers/sorting';
import { useFetchMessagesByFolder } from 'hooks/use-fetch-messages-by-folder';
import { useMultipleSelection } from 'hooks/use-multiple-selection';
import { MessageListComponent } from 'views/app/folder-panel/messages/message-list-component';
import { useLoadMoreForMessageList } from 'views/app/folder-panel/messages/message-list-hooks';
import { MessageListItemComponent } from 'views/app/folder-panel/messages/message-list-item-component';

export const MessageList = (): React.JSX.Element => {
	const [t] = useTranslation();
	const { itemId, folderId } = useParams() as { itemId?: string; folderId: string };
	const loadingMore = useRef<boolean>(false);
	const dragImageRef = useRef(null);
	const [draggedIds, setDraggedIds] = useState<Record<string, boolean>>({});
	const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

	const { messageIndexSlice } = useFetchMessagesByFolder(folderId);
	const { messageListIndex, status } = messageIndexSlice;

	const { prefs } = useUserSettings();
	const { sortOrder } = parseMessageSortingOptions(folderId, prefs.zimbraPrefSortOrder as string);
	const {
		deselectAll,
		isSelectModeOn,
		setIsSelectModeOn,
		selectAll,
		toggleItemSelection: toggle,
		isAllSelected,
		selectAllModeOff
	} = useMultipleSelection({
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
		limit: LIST_LIMIT.LOAD_MORE_LIMIT
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

	const selectedItemsMap: Record<string, boolean> = Object.fromEntries(
		Array.from(selectedItems, (item) => [item, true])
	);

	const listItems = useMemo(
		() =>
			map(messageListIndex, (id) => {
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
								<MessageListItemComponent
									deselectAll={deselectAll}
									messageId={id}
									selectedItems={selectedItemsMap}
									isSelected={isSelected}
									active={active}
									toggle={toggle}
									isSelectModeOn={isSelectModeOn}
									dragImageRef={dragImageRef}
									draggedIds={draggedIds}
									key={id}
									visible={visible}
									setDraggedIds={setDraggedIds}
									currentFolderId={folderId}
								/>
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
			messageListIndex,
			selectedItems,
			selectedItemsMap,
			toggle
		]
	);

	const selectedIds = useMemo(() => Array.from(selectedItems), [selectedItems]);

	const totalMessages = useMemo(() => messageListIndex.length, [messageListIndex.length]);

	const messagesLoadingCompleted = useMemo(() => status === API_REQUEST_STATUS.fulfilled, [status]);

	return (
		<MessageListComponent
			totalMessages={totalMessages}
			displayerTitle={displayerTitle}
			listItems={listItems}
			loadMoreCallback={hasMore ? loadMoreCallback : undefined}
			messagesLoadingCompleted={messagesLoadingCompleted}
			selectedIds={selectedIds}
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
		/>
	);
};
