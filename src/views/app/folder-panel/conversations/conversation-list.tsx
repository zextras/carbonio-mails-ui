/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { FOLDERS, t, useAppContext } from '@zextras/carbonio-shell-ui';
import { map } from 'lodash';
import { useParams } from 'react-router-dom';

import { ConversationListComponent } from './conversation-list-component';
import { ConversationListItemComponent } from './conversation-list-item-component';
import { CustomListItem } from '../../../../carbonio-ui-commons/components/list/list-item';
import { useFolder } from '../../../../carbonio-ui-commons/store/zustand/folder/hooks';
import { LIST_LIMIT } from '../../../../constants';
import { LIST_LIMIT } from '../../../../constants';
import { useKeyboardShortcuts } from '../../../../hooks/keyboard-shortcuts';
import { useAppDispatch, useAppSelector } from '../../../../hooks/redux';
import { useConversationListItems } from '../../../../hooks/use-conversation-list';
import { useSelection } from '../../../../hooks/use-selection';
import { search } from '../../../../store/actions';
import {
	selectConversationStatus,
	selectFolderSearchStatus
} from '../../../../store/conversations-slice';
import type { AppContext } from '../../../../types';

const ConversationList: FC = () => {
	const { folderId, itemId } = useParams<{ folderId: string; itemId: string }>();
	const { setCount, count } = useAppContext<AppContext>();
	const conversations = useConversationListItems();

	const [draggedIds, setDraggedIds] = useState<Record<string, boolean>>();
	const [isLoading, setIsLoading] = useState(false);
	const dragImageRef = useRef(null);
	const dispatch = useAppDispatch();
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

	const loadMore = useCallback(() => {
		if (hasMore && !isLoading) {
			const date =
				conversations?.[conversations.length - 1]?.date ?? new Date().setHours(0, 0, 0, 0);
			setIsLoading(true);
			const dateOrNull = date ? new Date(date) : null;
			dispatch(search({ folderId, before: dateOrNull, limit: LIST_LIMIT.LOAD_MORE_LIMIT })).then(
				() => {
					setIsLoading(false);
				}
			);
		}
	}, [hasMore, isLoading, conversations, dispatch, folderId]);

	const handleKeyboardShortcuts = useKeyboardShortcuts();
	useEffect(() => {
		const handler = (event: KeyboardEvent): void =>
			handleKeyboardShortcuts({
				event,
				folderId,
				itemId,
				conversations,
				dispatch,
				deselectAll
			});
		document.addEventListener('keydown', handler);
		return () => {
			document.removeEventListener('keydown', handler);
		};
	}, [folderId, itemId, conversations, dispatch, deselectAll, handleKeyboardShortcuts]);

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
				const active = itemId === conversation.id;
				const isSelected = selected[conversation.id];
				return (
					<CustomListItem
						active={active}
						selected={isSelected}
						background={conversation.read ? 'gray6' : 'gray5'}
						key={conversation.id}
					>
						{(visible: boolean): JSX.Element =>
							visible ? (
								<ConversationListItemComponent
									item={conversation}
									visible={visible}
									selected={isSelected}
									activeItemId={itemId}
									toggle={toggle}
									setDraggedIds={setDraggedIds}
									selectedItems={selected}
									dragImageRef={dragImageRef}
									selecting={isSelectModeOn}
									active={active}
									selectedIds={Object.keys(selected)}
									deselectAll={deselectAll}
									folderId={folderId}
								/>
							) : (
								<div style={{ height: '4rem' }} />
							)
						}
					</CustomListItem>
				);
			}),
		[conversations, deselectAll, folderId, isSelectModeOn, itemId, selected, toggle]
	);

	const totalConversations = useMemo(
		() => conversations.length ?? folder?.n ?? 0,
		[conversations.length, folder?.n]
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
			dragImageRef={dragImageRef}
			hasMore={hasMore}
		/>
	);
};
export default ConversationList;
