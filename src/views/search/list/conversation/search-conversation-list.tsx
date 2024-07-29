/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';

import { Container } from '@zextras/carbonio-design-system';
import { t, useAppContext } from '@zextras/carbonio-shell-ui';
import { isEmpty, map } from 'lodash';
import { useParams } from 'react-router-dom';

import { SearchConversationItem } from './search-conversation-item';
import { SearchConversationListComponent } from './search-conversation-list-component';
import { LIST_LIMIT } from '../../../../constants';
import { useAppDispatch } from '../../../../hooks/redux';
import { useSelection } from '../../../../hooks/use-selection';
import { search } from '../../../../store/actions/search';
import type { AppContext, SearchListProps } from '../../../../types';
import { getFolderParentId } from '../../../../ui-actions/utils';
import { AdvancedFilterButton } from '../../parts/advanced-filter-button';
import ShimmerList from '../../shimmer-list';

const SearchConversationList: FC<SearchListProps> = ({
	searchResults,
	query,
	loading,
	filterCount,
	setShowAdvanceFilters,
	isInvalidQuery,
	searchDisabled,
	invalidQueryTooltip,
	hasMore
}) => {
	const { itemId, folderId } = useParams<{ itemId: string; folderId: string }>();
	const { setCount, count } = useAppContext<AppContext>();
	const items = [...searchResults].map((conversationId) => ({ id: conversationId }));
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
		if (isEmpty(searchResults)) {
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
	}, [isInvalidQuery, searchResults, randomListIndex]);

	const conversationIds = useMemo(() => [...searchResults], [searchResults]);

	// totalConversations: length of conversations object
	const totalConversations = useMemo(() => searchResults.size, [searchResults]);

	const conversations = useMemo(() => Object.values(searchResults ?? {}), [searchResults]);

	useLayoutEffect(() => {
		listRef?.current && (listRef.current.children[0].scrollTop = 0);
	}, [searchResults]);

	const onScrollBottom = useCallback(() => {
		if (hasMore && !isLoading) {
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
	}, [dispatch, isLoading, query, hasMore, totalConversations]);
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
				<SearchConversationListComponent
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
					listRef={listRef}
				/>
			)}
			{loading && <ShimmerList count={33} delay={0} />}
		</Container>
	);
};
export default SearchConversationList;
