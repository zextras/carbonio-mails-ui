/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { FOLDERS, Folder, t, useAppContext, useFolder } from '@zextras/carbonio-shell-ui';
import { map } from 'lodash';
import React, { FC, ReactElement, useCallback, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../../../hooks/redux';
import { useMessageList } from '../../../../hooks/use-message-list';
import { useSelection } from '../../../../hooks/use-selection';
import { search } from '../../../../store/actions';
import { selectConversationStatus } from '../../../../store/conversations-slice';
import { selectFolderMsgSearchStatus } from '../../../../store/messages-slice';
import type { AppContext } from '../../../../types';
import { MessageListComponent } from './message-list-component';
import { MessageListItemComponent } from './message-list-item-component';
import { CustomListItem } from '../../../../carbonio-ui-commons/components/list/list-item';

export const MessageList: FC = () => {
	const { itemId, folderId } = useParams<{ itemId: string; folderId: string }>();
	const folder: Folder = useFolder(folderId);
	const dispatch = useAppDispatch();
	const { setCount, count } = useAppContext<AppContext>();
	const [draggedIds, setDraggedIds] = useState<Record<string, boolean>>({});
	const [isLoading, setIsLoading] = useState(false);
	const dragImageRef = useRef(null);
	const convListStatus = useAppSelector(selectConversationStatus);
	const messageListStatus = useAppSelector(selectFolderMsgSearchStatus(folderId));
	const messages = useMessageList();

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

	const hasMore = useMemo(() => convListStatus === 'hasMore', [convListStatus]);
	const loadMore = useCallback(
		(date) => {
			if (hasMore && !isLoading) {
				setIsLoading(true);
				const dateOrNull = date ? new Date(date) : null;
				dispatch(search({ folderId, before: dateOrNull, limit: 50, types: 'message' })).then(() => {
					setIsLoading(false);
				});
			}
		},
		[isLoading, hasMore, dispatch, folderId]
	);

	const displayerTitle = useMemo(() => {
		if (messages?.length === 0) {
			if (folderId === FOLDERS.SPAM) {
				return t('displayer.list_spam_title', 'There are no spam e-mails');
			}
			if (folderId === FOLDERS.SENT) {
				return t('displayer.list_sent_title', 'You haven’t sent any e-mail yet');
			}
			if (folderId === FOLDERS.DRAFTS) {
				return t('displayer.list_draft_title', 'There are no saved drafts');
			}
			if (folderId === FOLDERS.TRASH) {
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
						{(visible: boolean): ReactElement => (
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
							/>
						)}
					</CustomListItem>
				);
			}),
		[deselectAll, draggedIds, isSelectModeOn, itemId, messages, selected, toggle]
	);

	const loadMoreDate = useMemo(() => messages?.[messages.length - 1]?.date, [messages]);
	const totalMessages = useMemo(() => folder?.n ?? 0, [folder]);
	const selectedIds = useMemo(() => Object.keys(selected), [selected]);
	const messagesLoadingCompleted = useMemo(
		() => messageListStatus === 'complete',
		[messageListStatus]
	);

	return (
		<MessageListComponent
			totalMessages={totalMessages}
			displayerTitle={displayerTitle}
			listItems={listItems}
			loadMore={loadMore}
			loadMoreDate={loadMoreDate}
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
		/>
	);
};
