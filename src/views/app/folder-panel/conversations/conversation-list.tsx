/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';

import { ListItem } from '@zextras/carbonio-design-system';
import { t, useAppContext, useUserSettings } from '@zextras/carbonio-shell-ui';
import { map } from 'lodash';
import { useParams } from 'react-router-dom';

import { ConversationListComponent } from './conversation-list-component';
import { useLoadMoreForConversationList } from './conversation-list-hooks';
import { ConversationListItemComponent } from './conversation-list-item-component';
import { FOLDERS } from '../../../../carbonio-ui-commons/constants/folders';
import { useFolder } from '../../../../carbonio-ui-commons/store/zustand/folder/hooks';
import { API_REQUEST_STATUS, LIST_LIMIT } from '../../../../constants';
import { getFolderIdParts } from '../../../../helpers/folders';
import { parseMessageSortingOptions } from '../../../../helpers/sorting';
import { useConversationKeyboardShortcuts } from '../../../../hooks/use-conversation-keyboard-shortcuts';
import { useConversationListByFolder } from '../../../../hooks/use-conversations-list-by-folder';
import { useSelection } from '../../../../hooks/use-selection';
import type { AppContext } from '../../../../types';

export const ConversationList = (): React.JSX.Element => {
	const { folderId, itemId } = useParams<{ folderId: string; itemId: string }>();
	const { setCount, count } = useAppContext<AppContext>();
	const folder = useFolder(folderId);
	const { conversationIndexSlice } = useConversationListByFolder(folderId);
	const { status, conversationListIndex: conversationsIds } = conversationIndexSlice;
	const loadingMore = useRef<boolean>(false);

	const [draggedIds, setDraggedIds] = useState<Record<string, boolean>>();
	const dragImageRef = useRef(null);

	const {
		selected,
		toggle,
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

	const { prefs } = useUserSettings();
	const { sortOrder } = parseMessageSortingOptions(folderId, prefs.zimbraPrefSortOrder as string);

	const loadMore = useLoadMoreForConversationList({
		sortBy: sortOrder,
		offset: conversationsIds.length,
		limit: LIST_LIMIT.LOAD_MORE_LIMIT,
		hasMore: conversationIndexSlice.more,
		loadingMore,
		folderId
	});

	const keyboardActions = useConversationKeyboardShortcuts({
		conversationId: itemId,
		deselectAll,
		folderId
	});

	useEffect(() => {
		const handler = (event: KeyboardEvent): void => keyboardActions(event);
		document.addEventListener('keydown', handler);
		return () => {
			document.removeEventListener('keydown', handler);
		};
	}, [folderId, itemId, deselectAll, keyboardActions]);

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
					<ListItem active={active} selected={isSelected} background={'transparent'} key={id}>
						{(visible: boolean): React.JSX.Element =>
							visible ? (
								<ConversationListItemComponent
									conversationId={id}
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
					</ListItem>
				);
			}),
		[conversationsIds, deselectAll, folderId, isSelectModeOn, itemId, selected, toggle]
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
			conversationsIds={conversationsIds}
			selected={selected}
			deselectAll={deselectAll}
			dragImageRef={dragImageRef}
			hasMore={conversationIndexSlice.more}
		/>
	);
};
