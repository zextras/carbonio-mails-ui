/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';

import { Container, Padding, Text } from '@zextras/carbonio-design-system';
import { t } from '@zextras/carbonio-shell-ui';
import { CustomList, CustomListItem } from '@zextras/carbonio-ui-commons';
import { map } from 'lodash';
import { useParams } from 'react-router-dom';

import { SearchConversationListItem } from './search-conversation-list-item';
import type { SearchListPanelRouteParams } from '../../../../types/routes';
import { Divider } from '../../../app/preview/edit/parts/edit-view-styled-components';
import { SearchListHeader } from '../parts/search-list-header';
import { useMultipleSelection } from 'hooks/use-multiple-selection';
import type { SearchListProps } from 'types/index.d';
import { ConversationShortcutsRegister } from 'views/app/folder-panel/conversations/conversation-shortcuts-register';
import { ConversationsMultipleSelectionActions } from 'views/app/folder-panel/conversations/conversations-multiple-selection-actions';
import { useLoadMoreForSearchSlice } from 'views/search/search-view-hooks';
import ShimmerList from 'views/search/shimmer-list';

export const SearchConversationList = ({
	searchResults: conversationIds,
	query,
	loading,
	isInvalidQuery,
	hasMore,
	searchResultsStatus
}: SearchListProps): React.JSX.Element => {
	const { itemId } = useParams<SearchListPanelRouteParams>() as SearchListPanelRouteParams;
	const loadingMore = useRef<boolean>(false);
	const listRef = useRef<HTMLDivElement>(null);
	const totalConversations = useMemo(() => conversationIds.length, [conversationIds]);

	const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);
	const [selectedItems, setSelectedItems] = React.useState<Set<string>>(new Set());
	const [expandedConversations, setExpandedConversations] = useState<Record<string, boolean>>({});

	const toggleExpandedConversation = React.useCallback((conversationId: string) => {
		setExpandedConversations((prev) => ({
			...prev,
			[conversationId]: !prev[conversationId]
		}));
	}, []);

	useEffect(() => {
		setExpandedConversations({});
	}, [query]);

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
		allAvailableItems: conversationIds,
		selectedItems,
		setSelectedItems
	});

	const displayerTitle = useMemo(() => {
		if (searchResultsStatus === 'fulfilled' && conversationIds.length === 0 && !loading) {
			return t(
				'displayer.search_list_title1',
				'It looks like there are no results. Keep searching!'
			);
		}
		return null;
	}, [searchResultsStatus, conversationIds, loading]);

	const onScrollBottom = useLoadMoreForSearchSlice({
		query,
		offset: totalConversations,
		hasMore,
		loadingMore,
		types: 'conversation'
	});
	const selectedIdsArray = useMemo(() => Array.from(selectedItems), [selectedItems]);
	const keyboardShortcutsIds =
		selectedItems.size > 0 ? selectedIdsArray : ([itemId].filter(Boolean) as Array<string>);

	const listItems = useMemo(
		() =>
			map(conversationIds, (conversationId, index) => {
				const active = itemId === conversationId;

				const isSelected = selectedItems.has(conversationId);
				const isConversationExpanded = expandedConversations[conversationId];
				return (
					// WARNING: CustomList needs a CustomListItem as top-level children, else visibility breaks
					<CustomListItem
						active={active}
						selected={isSelected}
						key={conversationId}
						background={'transparent'}
					>
						{(visible: boolean): React.JSX.Element =>
							visible ? (
								<>
									{(active || isSelected) && (
										<ConversationShortcutsRegister
											conversationIds={keyboardShortcutsIds}
											folderId={''}
										/>
									)}

									<SearchConversationListItem
										key={conversationId}
										active={active}
										conversationId={conversationId}
										selecting={isSelectModeOn}
										activeItemId={itemId}
										selected={isSelected}
										index={index}
										onSelect={selectRange}
										onToggleExpanded={toggleExpandedConversation}
										isConversationExpanded={isConversationExpanded}
									/>
								</>
							) : (
								<div
									style={{ height: '4rem' }}
									data-testid={`invisible-conversation-${conversationId}`}
								/>
							)
						}
					</CustomListItem>
				);
			}),
		[
			conversationIds,
			itemId,
			selectedItems,
			keyboardShortcutsIds,
			isSelectModeOn,
			selectRange,
			expandedConversations,
			toggleExpandedConversation
		]
	);

	const selectedIds = useMemo(() => Array.from(selectedItems), [selectedItems]);

	return (
		<>
			{!isInvalidQuery && !loading && (
				<>
					<SearchListHeader
						itemIds={conversationIds}
						selectedItems={selectedItems}
						deselectAll={deselectAll}
						isSelectModeOn={isSelectModeOn}
						setIsSelectModeOn={setIsSelectModeOn}
						selectAll={selectAll}
						isAllSelected={isAllSelected}
						selectAllModeOff={selectAllModeOff}
					>
						<ConversationsMultipleSelectionActions
							selectedConversationsIds={selectedIds}
							folderId={''}
						/>
					</SearchListHeader>
					<Divider color="gray2" />
				</>
			)}
			{!loading && (
				<>
					{totalConversations > 0 || hasMore ? (
						<CustomList
							onListBottom={(): void => {
								onScrollBottom();
							}}
							data-testid={`conversation-list-${itemId}`}
							ref={listRef}
						>
							{listItems}
						</CustomList>
					) : (
						<Container>
							<Padding top="medium">
								<Text
									color="gray1"
									overflow="break-word"
									size="small"
									style={{ whiteSpace: 'pre-line', textAlign: 'center', paddingTop: '2rem' }}
								>
									{displayerTitle}
								</Text>
							</Padding>
						</Container>
					)}
				</>
			)}
			{loading && <ShimmerList count={33} delay={0} />}
		</>
	);
};
