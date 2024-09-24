/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { t, useAppContext, useUserSettings } from '@zextras/carbonio-shell-ui';
import { map } from 'lodash';
import { useParams } from 'react-router-dom';

import { ConversationListComponent } from './conversation-list-component';
import { ConversationListItemComponent } from './conversation-list-item-component';
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
import { useConversationKeyboardShortcuts } from '../../../../hooks/use-conversation-keyboard-shortcuts';
import { useConversationListItems } from '../../../../hooks/use-conversation-list';
import { useSelection } from '../../../../hooks/use-selection';
import { search } from '../../../../store/actions';
import {
	selectConversationsSearchRequestStatus,
	selectFolderSearchStatus
} from '../../../../store/conversations-slice';
import type { AppContext } from '../../../../types';

export const ConversationList: FC = () => {
	const { folderId, itemId } = useParams<{ folderId: string; itemId: string }>();
	const { setCount, count } = useAppContext<AppContext>();
	const conversations = useConversationListItems();

	const [draggedIds, setDraggedIds] = useState<Record<string, boolean>>();
	const dragImageRef = useRef(null);
	const dispatch = useAppDispatch();
	const searchRequestStatus = useAppSelector(selectConversationsSearchRequestStatus);

	const searchedInFolderStatus = useAppSelector(selectFolderSearchStatus(folderId));

	const {
		selected,
		toggle,
		deselectAll,
		isSelectModeOn,
		setIsSelectModeOn,
		selectAll,
		isAllSelected,
		selectAllModeOff
	} = useSelection({ setCount, count, items: conversations });

	const folder = useFolder(folderId);
	const hasMore = useMemo(
		() => searchedInFolderStatus === SEARCHED_FOLDER_STATE_STATUS.hasMore,
		[searchedInFolderStatus]
	);

	const { prefs } = useUserSettings();
	const { sortOrder } = parseMessageSortingOptions(folderId, prefs.zimbraPrefSortOrder as string);

	const loadMore = useCallback(() => {
		if (!hasMore) return;
		const offset = conversations.length;
		dispatch(search({ folderId, offset, sortBy: sortOrder, limit: LIST_LIMIT.LOAD_MORE_LIMIT }));
	}, [hasMore, conversations.length, dispatch, folderId, sortOrder]);

	const handleKeyboardShortcuts = useConversationKeyboardShortcuts();
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
						{(visible: boolean): React.JSX.Element =>
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
		() => searchRequestStatus === API_REQUEST_STATUS.fulfilled,
		[searchRequestStatus]
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
