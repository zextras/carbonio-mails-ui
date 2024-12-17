/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { ReactElement, useEffect, useMemo, useRef, useState } from 'react';

import { t, useAppContext, useUserSettings } from '@zextras/carbonio-shell-ui';
import { map } from 'lodash';
import { useParams } from 'react-router-dom';

import { MessageListComponent } from './message-list-component';
import { useLoadMoreForMessagesSlice } from './message-list-hooks';
import { MessageListItemComponent } from './message-list-item-component';
import { CustomListItem } from '../../../../carbonio-ui-commons/components/list/list-item';
import { FOLDERS } from '../../../../carbonio-ui-commons/constants/folders';
import { useFolder } from '../../../../carbonio-ui-commons/store/zustand/folder/hooks';
import { API_REQUEST_STATUS, LIST_LIMIT } from '../../../../constants';
import { getFolderIdParts } from '../../../../helpers/folders';
import { parseMessageSortingOptions } from '../../../../helpers/sorting';
import { useMessageListByFolder } from '../../../../hooks/use-message-list-by-folder';
import { useSelection } from '../../../../hooks/use-selection';
import type { AppContext, Folder } from '../../../../types';

export const MessageList = (): React.JSX.Element => {
	const { itemId, folderId } = useParams<{ itemId: string; folderId: string }>();
	const loadingMore = useRef<boolean>(false);
	const dragImageRef = useRef(null);
	const folder = useFolder(folderId) as Folder;
	const { setCount, count } = useAppContext<AppContext>();
	const [draggedIds, setDraggedIds] = useState<Record<string, boolean>>({});

	const { messagesSlice } = useMessageListByFolder(folder);
	const { messageIds, status } = messagesSlice;

	const { prefs } = useUserSettings();
	const { sortOrder } = parseMessageSortingOptions(folderId, prefs.zimbraPrefSortOrder as string);
	const items = [...messageIds].map((messageId) => ({ id: messageId }));
	const {
		selected,
		deselectAll,
		isSelectModeOn,
		setIsSelectModeOn,
		selectAll,
		toggle,
		isAllSelected,
		selectAllModeOff
	} = useSelection({
		setCount,
		count,
		items
	});

	const loadMoreCallback = useLoadMoreForMessagesSlice({
		folderId,
		loadingMore,
		hasMore: messagesSlice.more,
		sortBy: sortOrder,
		offset: messageIds.size,
		limit: LIST_LIMIT.LOAD_MORE_LIMIT,
		types: 'message'
	});

	const displayerTitle = useMemo(() => {
		if (messageIds?.size === 0) {
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
	}, [messageIds, folderId]);

	const listItems = useMemo(
		() =>
			map(items, (item) => {
				const isSelected = selected[item.id];
				const active = itemId === item.id;
				return (
					<CustomListItem
						key={item.id}
						selected={isSelected}
						active={active}
						background={'transparent'}
					>
						{(visible: boolean): ReactElement =>
							visible ? (
								<MessageListItemComponent
									messageId={item.id}
									selected={selected}
									isSelected={isSelected}
									active={active}
									toggle={toggle}
									isSelectModeOn={isSelectModeOn}
									dragImageRef={dragImageRef}
									draggedIds={draggedIds}
									key={item.id}
									deselectAll={deselectAll}
									visible={visible}
									setDraggedIds={setDraggedIds}
									currentFolderId={folderId}
								/>
							) : (
								<div style={{ height: '4rem' }} />
							)
						}
					</CustomListItem>
				);
			}),
		[deselectAll, draggedIds, folderId, isSelectModeOn, itemId, items, selected, toggle]
	);

	const totalMessages = useMemo(() => {
		if (sortOrder === 'readAsc') {
			return messageIds.size;
		}
		return folder?.n ?? messageIds.size ?? 0;
	}, [folder?.n, messageIds.size, sortOrder]);

	const selectedIds = useMemo(() => Object.keys(selected), [selected]);

	const messagesLoadingCompleted = useMemo(() => status === API_REQUEST_STATUS.fulfilled, [status]);

	useEffect(() => {
		setDraggedIds(selected);
	}, [selected]);

	return (
		<MessageListComponent
			totalMessages={totalMessages}
			displayerTitle={displayerTitle}
			listItems={listItems}
			loadMore={loadMoreCallback}
			messagesLoadingCompleted={messagesLoadingCompleted}
			selectedIds={selectedIds}
			folderId={folderId}
			messageIds={messageIds}
			draggedIds={draggedIds}
			setDraggedIds={setDraggedIds}
			isSelectModeOn={isSelectModeOn}
			setIsSelectModeOn={setIsSelectModeOn}
			isAllSelected={isAllSelected}
			selectAll={selectAll}
			deselectAll={deselectAll}
			selected={selected}
			selectAllModeOff={selectAllModeOff}
			dragImageRef={dragImageRef}
			hasMore={messagesSlice.more}
		/>
	);
};
