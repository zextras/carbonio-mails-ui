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

import { SearchMessageItem } from './search-message-item';
import { SearchMessageListComponent } from './search-message-list-component';
import { LIST_LIMIT } from '../../../../constants';
import { useAppDispatch } from '../../../../hooks/redux';
import { useSelection } from '../../../../hooks/use-selection';
import { search } from '../../../../store/actions/search';
import type { AppContext, SearchListProps } from '../../../../types';
import { AdvancedFilterButton } from '../../parts/advanced-filter-button';
import ShimmerList from '../../shimmer-list';

export const SearchMessageList: FC<SearchListProps> = ({
	searchDisabled,
	searchResults,
	query,
	loading,
	filterCount,
	setShowAdvanceFilters,
	isInvalidQuery,
	invalidQueryTooltip,
	hasMore
}) => {
	const { itemId, folderId } = useParams<{ itemId: string; folderId: string }>();
	const { setCount, count } = useAppContext<AppContext>();

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
		items: [...searchResults].map((message) => ({ id: message }))
	});

	const [isLoading, setIsLoading] = useState(false);
	const listRef = useRef<HTMLDivElement>(null);
	const dispatch = useAppDispatch();

	const displayerTitle = useMemo(() => {
		if (!isInvalidQuery && isEmpty(searchResults)) {
			return t(
				'displayer.search_list_title1',
				'It looks like there are no results. Keep searching!'
			);
		}
		return null;
	}, [isInvalidQuery, searchResults]);

	const messageIds = useMemo(() => [...searchResults], [searchResults]);

	const listItems = useMemo(
		() =>
			map(messageIds, (messageId) => {
				const active = itemId === messageId;
				const isSelected = selected[messageId];
				return (
					<SearchMessageItem
						messageId={messageId}
						key={messageId}
						selected={selected}
						isSelected={isSelected}
						active={active}
						toggle={toggle}
						isSelectModeOn={isSelectModeOn}
						deselectAll={deselectAll}
					/>
				);
			}),
		[deselectAll, isSelectModeOn, itemId, messageIds, selected, toggle]
	);

	const totalMessages = useMemo(() => searchResults.size, [searchResults]);

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
					types: 'message',
					offset: totalMessages,
					recip: '0'
				})
			).then(() => {
				setIsLoading(false);
			});
		}
	}, [dispatch, isLoading, query, hasMore, totalMessages]);

	const messagesLoadingCompleted = true;
	//  useMemo(
	// 	() => !isArray(searchResults?.messageIds),
	// 	[searchResults?.messageIds]
	// );
	const selectedIds = useMemo(() => Object.keys(selected), [selected]);
	const messages = useMemo(() => [...searchResults].map((id) => ({ id })), [searchResults]);

	return (
		<Container
			background="gray6"
			width="25%"
			height="fill"
			mainAlignment="flex-start"
			data-testid="MailsSearchResultListContainer"
		>
			<AdvancedFilterButton
				setShowAdvanceFilters={setShowAdvanceFilters}
				filterCount={filterCount}
				searchDisabled={searchDisabled}
				invalidQueryTooltip={invalidQueryTooltip}
			/>
			<SearchMessageListComponent
				totalMessages={totalMessages}
				displayerTitle={displayerTitle}
				listItems={listItems}
				messagesLoadingCompleted={messagesLoadingCompleted}
				selectedIds={selectedIds}
				folderId={folderId}
				messages={messages}
				isSelectModeOn={isSelectModeOn}
				setIsSelectModeOn={setIsSelectModeOn}
				isAllSelected={isAllSelected}
				selectAll={selectAll}
				deselectAll={deselectAll}
				selected={selected}
				selectAllModeOff={selectAllModeOff}
				isSearchModule
				setDraggedIds={noop}
				loadMore={onScrollBottom}
				listRef={listRef}
			/>
			{loading && <ShimmerList count={33} delay={0} />}
		</Container>
	);
};
