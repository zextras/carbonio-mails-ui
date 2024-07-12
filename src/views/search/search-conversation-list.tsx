/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';

import { Container } from '@zextras/carbonio-design-system';
import { t, useAppContext } from '@zextras/carbonio-shell-ui';
import { isEmpty, map, noop } from 'lodash';
import { useParams } from 'react-router-dom';

import { AdvancedFilterButton } from './parts/advanced-filter-button';
import { SearchConversationItem } from './search-conversation-item';
import ShimmerList from './shimmer-list';
import { LIST_LIMIT } from '../../constants';
import { useAppDispatch } from '../../hooks/redux';
import { useSelection } from '../../hooks/use-selection';
import { search } from '../../store/actions/search';
import type { AppContext, SearchListProps } from '../../types';
import { getFolderParentId } from '../../ui-actions/utils';
import { ConversationListComponent } from '../app/folder-panel/conversations/conversation-list-component';

const SearchConversationList: FC<SearchListProps> = ({
	searchResults,
	query,
	loading,
	filterCount,
	setShowAdvanceFilters,
	isInvalidQuery,
	searchDisabled,
	invalidQueryTooltip
}) => {
	const { itemId, folderId } = useParams<{ itemId: string; folderId: string }>();
	const { setCount, count } = useAppContext<AppContext>();
	const items = [...searchResults.conversationIds].map((conversationId) => ({
		id: conversationId
	}));
	const dispatch = useAppDispatch();
	const parentId = getFolderParentId({ folderId, isConversation: true, items });
	const [isLoading, setIsLoading] = useState(false);

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
		currentFolderId: folderId,
		setCount,
		count,
		items
	});

	// selectedIds is an array of the ids of the selected conversations for multiple selection actions
	const selectedIds = useMemo(() => Object.keys(selected), [selected]);

	// This line of code assigns a random integer between 0 and 1 to the const randomListIndex
	const randomListIndex = useMemo(() => Math.floor(Math.random() * 2), []);
	const listRef = useRef<HTMLDivElement>(null);

	const displayerTitle = useMemo(() => {
		// If the query is invalid, don't return a title
		if (isInvalidQuery) {
			return null;
		}
		// If there are no results, return a title
		if (isEmpty(searchResults.conversationIds)) {
			if (randomListIndex === 0) {
				return t(
					'displayer.search_list_title1',
					'It looks like there are no results. Keep searching!'
				);
			}
			return t('displayer.search_list_title2', 'None of your items matches your search.');
		}
		// If there are results, don't return a title
		return null;
	}, [isInvalidQuery, searchResults.conversationIds, randomListIndex]);

	const conversationIds = useMemo(
		() => [...searchResults.conversationIds],
		[searchResults?.conversationIds]
	);

	// totalConversations: length of conversations object
	const totalConversations = useMemo(
		() => searchResults.conversationIds.size,
		[searchResults?.conversationIds]
	);

	// If the search results have completed loading, we can display the search results.
	// Otherwise, we display a loading indicator.
	const conversationsLoadingCompleted = useMemo(
		() => searchResults?.status === 'fulfilled',
		[searchResults?.status]
	);

	const conversations = useMemo(
		() => Object.values(searchResults?.conversationIds ?? {}),
		[searchResults?.conversationIds]
	);

	useLayoutEffect(() => {
		listRef?.current && (listRef.current.children[0].scrollTop = 0);
	}, [searchResults.query]);

	const onScrollBottom = useCallback(() => {
		if (searchResults.more && !isLoading) {
			setIsLoading(true);
			dispatch(
				search({
					query,
					limit: LIST_LIMIT.LOAD_MORE_LIMIT,
					sortBy: 'dateDesc',
					types: 'conversation',
					offset: totalConversations,
					recip: '0'
				})
			).then(() => {
				setIsLoading(false);
			});
		}
	}, [dispatch, isLoading, query, searchResults, totalConversations]);
	// This is used to render the list items. It maps the conversationList array and returns a list item for each conversation.
	const listItems = useMemo(
		() =>
			map(conversationIds, (conversationId) => {
				const active = itemId === conversationId;
				const isSelected = selected[conversationId];
				return (
					<SearchConversationItem
						key={conversationId}
						conversationId={conversationId}
						itemId={itemId}
						isSelected={isSelected}
						active={active}
						toggle={toggle}
						isSelectModeOn={isSelectModeOn}
						deselectAll={deselectAll}
					/>
				);
			}),
		[conversationIds, deselectAll, isSelectModeOn, itemId, selected, toggle]
	);

	return (
		<Container background="gray6" width="25%" height="fill" mainAlignment="flex-start">
			<AdvancedFilterButton
				setShowAdvanceFilters={setShowAdvanceFilters}
				filterCount={filterCount}
				searchDisabled={searchDisabled}
				invalidQueryTooltip={invalidQueryTooltip}
			/>
			{!isInvalidQuery && (
				<ConversationListComponent
					displayerTitle={displayerTitle}
					listItems={listItems}
					totalConversations={totalConversations}
					conversationsLoadingCompleted
					selectedIds={selectedIds}
					folderId={parentId}
					conversations={conversations}
					isSelectModeOn={isSelectModeOn}
					selected={selected}
					deselectAll={deselectAll}
					selectAll={selectAll}
					isAllSelected={isAllSelected}
					selectAllModeOff={selectAllModeOff}
					setIsSelectModeOn={setIsSelectModeOn}
					loadMore={onScrollBottom}
					isSearchModule
					setDraggedIds={noop}
					listRef={listRef}
				/>
			)}
			{loading && <ShimmerList count={33} delay={0} />}
		</Container>
	);
};
export default SearchConversationList;
