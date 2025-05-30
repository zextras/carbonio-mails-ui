/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useMemo, useRef } from 'react';

import { Container, Padding, Text } from '@zextras/carbonio-design-system';
import { t, useAppContext } from '@zextras/carbonio-shell-ui';
import { CustomList, CustomListItem } from '@zextras/carbonio-ui-commons';
import { isEmpty, map } from 'lodash';
import { useParams } from 'react-router-dom';

import { useSelection } from 'hooks/use-selection';
import type { AppContext, SearchListProps } from 'types/index.d';
import { Divider } from 'views/app/detail-panel/edit/parts/edit-view-styled-components';
import { ConversationsMultipleSelectionActions } from 'views/app/folder-panel/conversations/conversations-multiple-selection-actions';
import { SearchConversationListItem } from 'views/search/list/conversation/search-conversation-list-item';
import { SearchListHeader } from 'views/search/list/parts/search-list-header';
import { useLoadMoreForSearchSlice } from 'views/search/search-view-hooks';
import ShimmerList from 'views/search/shimmer-list';

export const SearchConversationList = ({
	searchResults: conversationIds,
	query,
	loading,
	isInvalidQuery,
	hasMore
}: SearchListProps): React.JSX.Element => {
	const { itemId } = useParams() as { itemId?: string };
	const loadingMore = useRef<boolean>(false);
	const { setCount, count } = useAppContext<AppContext>();
	const listRef = useRef<HTMLDivElement>(null);
	const totalConversations = useMemo(() => conversationIds.length, [conversationIds]);

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
		items: conversationIds
	});

	const displayerTitle = useMemo(() => {
		if (isInvalidQuery) {
			return null;
		}
		if (isEmpty(conversationIds)) {
			return t(
				'displayer.search_list_title1',
				'It looks like there are no results. Keep searching!'
			);
		}
		return null;
	}, [isInvalidQuery, conversationIds]);

	const onScrollBottom = useLoadMoreForSearchSlice({
		query,
		offset: totalConversations,
		hasMore,
		loadingMore,
		types: 'conversation'
	});

	const listItems = useMemo(
		() =>
			map(conversationIds, (conversationId) => {
				const active = itemId === conversationId;

				const isSelected = selected[conversationId];
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
								<SearchConversationListItem
									key={conversationId}
									active={active}
									conversationId={conversationId}
									selecting={isSelectModeOn}
									activeItemId={itemId}
									toggle={toggle}
									selected={isSelected}
									deselectAll={deselectAll}
								/>
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
		[conversationIds, deselectAll, isSelectModeOn, itemId, selected, toggle]
	);

	const selectedIds = useMemo(() => Object.keys(selected), [selected]);

	return (
		<>
			{!isInvalidQuery && !loading && (
				<>
					<SearchListHeader
						itemIds={conversationIds}
						selected={selected}
						deselectAll={deselectAll}
						isSelectModeOn={isSelectModeOn}
						setIsSelectModeOn={setIsSelectModeOn}
						selectAll={selectAll}
						isAllSelected={isAllSelected}
						selectAllModeOff={selectAllModeOff}
					>
						<ConversationsMultipleSelectionActions
							selectedConversationsIds={selectedIds}
							deselectAll={deselectAll}
							folderId={''}
						/>
					</SearchListHeader>
					<Divider color="gray2" />
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
