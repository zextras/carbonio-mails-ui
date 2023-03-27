/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { SnackbarManagerContext } from '@zextras/carbonio-design-system';
import { FOLDERS, t, useAppContext, useFolder } from '@zextras/carbonio-shell-ui';
import { map } from 'lodash';
import React, { FC, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { CustomListItem } from '../../../../carbonio-ui-commons/components/list/list-item';
import { handleKeyboardShortcuts } from '../../../../hooks/keyboard-shortcuts';
import { useAppDispatch, useAppSelector } from '../../../../hooks/redux';
import { useConversationListItems } from '../../../../hooks/use-conversation-list';
import { useSelection } from '../../../../hooks/use-selection';
import { search } from '../../../../store/actions';
import {
	selectConversationStatus,
	selectFolderSearchStatus
} from '../../../../store/conversations-slice';
import { AppContext } from '../../../../types';
import { ConversationListComponent } from './conversation-list-component';
import { ConversationListItemComponent } from './conversation-list-item-component';

const ConversationList: FC = () => {
	const { folderId, itemId } = useParams<{ folderId: string; itemId: string }>();
	const { setCount, count } = useAppContext<AppContext>();
	const conversations = useConversationListItems();

	const [draggedIds, setDraggedIds] = useState<Record<string, boolean>>();
	const [isLoading, setIsLoading] = useState(false);
	const dragImageRef = useRef(null);
	const dispatch = useAppDispatch();
	const createSnackbar = useContext(SnackbarManagerContext);
	const status = useAppSelector(selectConversationStatus);

	const conversationListStatus = useAppSelector((store) =>
		selectFolderSearchStatus(store, folderId)
	);

	const {
		selected,
		toggle,
		deselectAll,
		isSelectModeOn,
		setIsSelectModeOn,
		selectAll,
		isAllSelected,
		selectAllModeOff
	} = useSelection({ currentFolderId: folderId, setCount, count, items: conversations });

	const folder = useFolder(folderId);
	const hasMore = useMemo(() => status === 'hasMore', [status]);

	const loadMore = useCallback(
		(date) => {
			if (hasMore && !isLoading) {
				setIsLoading(true);
				const dateOrNull = date ? new Date(date) : null;
				dispatch(search({ folderId, before: dateOrNull, limit: 50 })).then(() => {
					setIsLoading(false);
				});
			}
		},
		[hasMore, isLoading, dispatch, folderId]
	);

	useEffect(() => {
		const handler = (event: KeyboardEvent): void =>
			handleKeyboardShortcuts({
				event,
				folderId,
				itemId,
				conversations,
				dispatch,
				deselectAll,
				createSnackbar
			});
		document.addEventListener('keydown', handler);
		return () => {
			document.removeEventListener('keydown', handler);
		};
	}, [folderId, itemId, conversations, dispatch, deselectAll, createSnackbar]);

	const displayerTitle = useMemo(() => {
		if (conversations?.length === 0) {
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
	}, [conversations, folderId]);

	const listItems = useMemo(
		() =>
			map(conversations, (conversation) => {
				const isActive = itemId === conversation.id;
				const isSelected = selected[conversation.id];
				return (
					<>
						<CustomListItem
							active={isActive}
							selected={isSelected}
							background={conversation.read ? 'gray6' : 'gray5'}
							key={conversation.id}
						>
							{(isVisible: boolean): JSX.Element => (
								<ConversationListItemComponent
									item={conversation}
									visible={isVisible}
									selected={isSelected}
									activeItemId={itemId}
									toggle={toggle}
									setDraggedIds={setDraggedIds}
									selectedItems={selected}
									dragImageRef={dragImageRef}
									selecting={isSelectModeOn}
									active={isActive}
									selectedIds={Object.keys(selected)}
									deselectAll={deselectAll}
								/>
							)}
						</CustomListItem>
					</>
				);
			}),
		[conversations, deselectAll, isSelectModeOn, itemId, selected, toggle]
	);

	const totalConversations = useMemo(() => folder?.n ?? 0, [folder]);
	const loadMoreDate = useMemo(
		() => conversations?.[conversations.length - 1]?.date,
		[conversations]
	);
	const selectedIds = useMemo(() => Object.keys(selected), [selected]);
	const conversationsLoadingCompleted = useMemo(
		() => conversationListStatus === 'complete',
		[conversationListStatus]
	);

	return (
		<ConversationListComponent
			listItems={listItems}
			displayerTitle={displayerTitle}
			totalConversations={totalConversations}
			conversationsLoadingCompleted={conversationsLoadingCompleted}
			loadMore={loadMore}
			loadMoreDate={loadMoreDate}
			selectedIds={selectedIds}
			isSelectModeOn={isSelectModeOn}
			setIsSelectModeOn={setIsSelectModeOn}
			selectAll={selectAll}
			isAllSelected={isAllSelected}
			selectAllModeOff={selectAllModeOff}
			draggedIds={draggedIds}
			folderId={folderId}
			conversations={conversations}
			selected={selected}
			deselectAll={deselectAll}
		/>
	);
};
export default ConversationList;
