/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useMemo, useRef, useState } from 'react';

import { ListItem } from '@zextras/carbonio-design-system';
import { t, useAppContext, useUserSettings } from '@zextras/carbonio-shell-ui';
import { FOLDERS, useFolder } from '@zextras/carbonio-ui-commons';
import { map } from 'lodash';
import { useParams } from 'react-router-dom';

import { API_REQUEST_STATUS, LIST_LIMIT } from 'constants/index';
import { getFolderIdParts } from 'helpers/folders';
import { parseMessageSortingOptions } from 'helpers/sorting';
import { useConversationListByFolder } from 'hooks/use-conversations-list-by-folder';
import { useSelection } from 'hooks/use-selection';
import type { AppContext } from 'types/index.d';
import { ConversationListComponent } from 'views/app/folder-panel/conversations/conversation-list-component';
import { useLoadMoreForConversationList } from 'views/app/folder-panel/conversations/conversation-list-hooks';
import { ConversationListItemComponent } from 'views/app/folder-panel/conversations/conversation-list-item-component';
import { ConversationShortcutsRegister } from 'views/app/folder-panel/conversations/conversation-shortcuts-register';

export const ConversationList = (): React.JSX.Element => {
	const { folderId, itemId } = useParams() as { folderId: string; itemId?: string };
	const { setCount, count } = useAppContext<AppContext>();
	const folder = useFolder(folderId);
	const { conversationIndexSlice } = useConversationListByFolder(folderId);
	const { status, conversationListIndex: conversationsIds } = conversationIndexSlice;

	const [draggedIds, setDraggedIds] = useState<Record<string, boolean>>();
	const dragImageRef = useRef(null);

	const {
		selected,
		toggle: toggleMultipleSelection,
		deselectAll,
		isSelectModeOn,
		setIsSelectModeOn,
		selectAll,
		isAllSelected,
		selectAllModeOff
	} = useSelection({
		setCount,
		count,
		items: conversationsIds
	});

	const displayerTitle = useMemo(() => {
		if (conversationsIds?.length === 0) {
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
	}, [conversationsIds?.length, folderId]);

	const listItems = useMemo(
		() =>
			map(conversationsIds, (id) => {
				const active = itemId === id;
				const isSelected = selected[id];
				return (
					<ListItem
						data-testid={`conversation-list-item-${id}`}
						active={active}
						selected={isSelected}
						background={'transparent'}
						key={id}
					>
						{(visible: boolean): React.JSX.Element =>
							visible ? (
								<ConversationListItemComponent
									conversationId={id}
									visible={visible}
									selected={isSelected}
									activeItemId={itemId}
									toggleMultipleSelection={toggleMultipleSelection}
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
								<div style={{ height: '4rem' }} data-testid="conversation-invisible-item" />
							)
						}
					</ListItem>
				);
			}),
		[
			conversationsIds,
			deselectAll,
			folderId,
			isSelectModeOn,
			itemId,
			selected,
			toggleMultipleSelection
		]
	);

	const totalConversations = useMemo(
		() => conversationsIds.length ?? folder?.n ?? 0,
		[conversationsIds.length, folder?.n]
	);
	const selectedIds = useMemo(() => Object.keys(selected), [selected]);

	const conversationsLoadingCompleted = useMemo(
		() => status === API_REQUEST_STATUS.fulfilled,
		[status]
	);
	const loadingMore = useRef<boolean>(false);
	const { prefs } = useUserSettings();
	const { sortOrder } = parseMessageSortingOptions(folderId, prefs.zimbraPrefSortOrder as string);

	const loadMoreCallback = useLoadMoreForConversationList({
		sortBy: sortOrder,
		offset: conversationsIds.length,
		limit: LIST_LIMIT.LOAD_MORE_LIMIT,
		hasMore: conversationIndexSlice.more,
		loadingMore,
		folderId
	});

	return (
		<>
			{itemId && (
				<ConversationShortcutsRegister
					conversationId={itemId}
					folderId={folderId}
					deselectAll={deselectAll}
				/>
			)}
			<ConversationListComponent
				listItems={listItems}
				displayerTitle={displayerTitle}
				totalConversations={totalConversations}
				conversationsLoadingCompleted={conversationsLoadingCompleted}
				selectedIds={selectedIds}
				isSelectModeOn={isSelectModeOn}
				setIsSelectModeOn={setIsSelectModeOn}
				selectAll={selectAll}
				isAllSelected={isAllSelected}
				selectAllModeOff={selectAllModeOff}
				draggedIds={draggedIds}
				folderId={folderId}
				conversationsIds={conversationsIds}
				selected={selected}
				deselectAll={deselectAll}
				dragImageRef={dragImageRef}
				loadMoreCallback={conversationIndexSlice.more ? loadMoreCallback : undefined}
			/>
		</>
	);
};
