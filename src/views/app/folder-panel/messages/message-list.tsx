/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, ReactElement, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { t, useAppContext, useUserSettings } from '@zextras/carbonio-shell-ui';
import { map } from 'lodash';
import { useParams } from 'react-router-dom';

import { MessageListComponent } from './message-list-component';
import { MessageListItemComponent } from './message-list-item-component';
import { CustomListItem } from '../../../../carbonio-ui-commons/components/list/list-item';
import { FOLDERS } from '../../../../carbonio-ui-commons/constants/folders';
import { useFolder } from '../../../../carbonio-ui-commons/store/zustand/folder/hooks';
import {
	API_REQUEST_STATUS,
	LIST_LIMIT,
	SEARCHED_FOLDER_STATE_STATUS
} from '../../../../constants';
import { getFolderIdParts } from '../../../../helpers/folders';
import { parseMessageSortingOptions } from '../../../../helpers/sorting';
import { useAppDispatch, useAppSelector } from '../../../../hooks/redux';
import { useMessageList } from '../../../../hooks/use-message-list';
import { useSelection } from '../../../../hooks/use-selection';
import { search } from '../../../../store/actions';
import {
	selectFolderMsgSearchStatus,
	selectMessagesSearchRequestStatus
} from '../../../../store/messages-slice';
import type { AppContext } from '../../../../types';

export const MessageList: FC = () => {
	const { itemId, folderId } = useParams<{ itemId: string; folderId: string }>();
	const folder = useFolder(folderId);
	const dispatch = useAppDispatch();
	const { setCount, count } = useAppContext<AppContext>();
	const [draggedIds, setDraggedIds] = useState<Record<string, boolean>>({});
	const dragImageRef = useRef(null);
	const searchRequestStatus = useAppSelector(selectMessagesSearchRequestStatus);
	const searchedInFolderStatus = useAppSelector(selectFolderMsgSearchStatus(folderId));

	const messages = useMessageList();

	const { prefs } = useUserSettings();
	const { sortOrder } = parseMessageSortingOptions(folderId, prefs.zimbraPrefSortOrder as string);

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
		currentFolderId: folderId,
		setCount,
		count,
		items: messages
	});

	const hasMore = useMemo(
		() => searchedInFolderStatus === SEARCHED_FOLDER_STATE_STATUS.hasMore,
		[searchedInFolderStatus]
	);

	const loadMore = useCallback(() => {
		if (!hasMore) return;
		const offset = messages.length;
		dispatch(
			search({
				folderId,
				sortBy: sortOrder,
				offset,
				limit: LIST_LIMIT.LOAD_MORE_LIMIT,
				types: 'message'
			})
		);
	}, [dispatch, folderId, hasMore, messages.length, sortOrder]);

	const displayerTitle = useMemo(() => {
		if (messages?.length === 0) {
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
	}, [messages, folderId]);

	const listItems = useMemo(
		() =>
			map(messages, (message) => {
				const isSelected = selected[message.id];
				const active = itemId === message.id;
				return (
					<CustomListItem
						key={message.id}
						selected={isSelected}
						active={active}
						background={message.read ? 'gray6' : 'gray5'}
					>
						{(visible: boolean): ReactElement =>
							visible ? (
								<MessageListItemComponent
									message={message}
									selected={selected}
									isSelected={isSelected}
									active={active}
									toggle={toggle}
									isSelectModeOn={isSelectModeOn}
									dragImageRef={dragImageRef}
									draggedIds={draggedIds}
									key={message.id}
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
		[deselectAll, draggedIds, folderId, isSelectModeOn, itemId, messages, selected, toggle]
	);

	const totalMessages = useMemo(
		() => (sortOrder === 'readAsc' ? messages.length : (folder?.n ?? messages.length ?? 0)),
		[folder?.n, messages.length, sortOrder]
	);

	const selectedIds = useMemo(() => Object.keys(selected), [selected]);

	const messagesLoadingCompleted = useMemo(
		() => searchRequestStatus === API_REQUEST_STATUS.fulfilled,
		[searchRequestStatus]
	);

	useEffect(() => {
		setDraggedIds(selected);
	}, [selected]);

	return (
		<MessageListComponent
			totalMessages={totalMessages}
			displayerTitle={displayerTitle}
			listItems={listItems}
			loadMore={loadMore}
			messagesLoadingCompleted={messagesLoadingCompleted}
			selectedIds={selectedIds}
			folderId={folderId}
			messages={messages}
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
			hasMore={hasMore}
		/>
	);
};
