/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';

import { Container, Padding, Text } from '@zextras/carbonio-design-system';
import { t, useAppContext } from '@zextras/carbonio-shell-ui';
import { isEmpty, map } from 'lodash';
import { useParams } from 'react-router-dom';

import { SearchConversationListHeader } from './header';
import { SearchConversationListItem } from './item';
import { CustomList } from '../../../../carbonio-ui-commons/components/list/list';
import { LIST_LIMIT } from '../../../../constants';
import { useAppDispatch } from '../../../../hooks/redux';
import { useSelection } from '../../../../hooks/use-selection';
import { search } from '../../../../store/actions/search';
import type { AppContext, SearchListProps } from '../../../../types';
import { Divider } from '../../../app/detail-panel/edit/parts/edit-view-styled-components';
import { AdvancedFilterButton } from '../../parts/advanced-filter-button';
import ShimmerList from '../../shimmer-list';

export const SearchConversationList: FC<SearchListProps> = ({
	searchResults: conversationIds,
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
	const items = [...conversationIds].map((conversationId) => ({ id: conversationId }));
	const dispatch = useAppDispatch();
	const [isLoading, setIsLoading] = useState(false);

	const { selected, toggle, deselectAll } = useSelection({
		setCount,
		count,
		items
	});

	// selectedIds is an array of the ids of the selected conversations for multiple selection actions

	// This line of code assigns a random integer between 0 and 1 to the const randomListIndex
	const randomListIndex = useMemo(() => Math.floor(Math.random() * 2), []);
	const listRef = useRef<HTMLDivElement>(null);

	const displayerTitle = useMemo(() => {
		// If the query is invalid, don't return a title
		if (isInvalidQuery) {
			return null;
		}
		// If there are no results, return a title
		if (isEmpty(conversationIds)) {
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
	}, [isInvalidQuery, conversationIds, randomListIndex]);

	// totalConversations: length of conversations object
	const totalConversations = useMemo(() => conversationIds.size, [conversationIds]);

	const conversations = useMemo(() => Object.values(conversationIds ?? {}), [conversationIds]);

	useLayoutEffect(() => {
		listRef?.current && (listRef.current.children[0].scrollTop = 0);
	}, [conversationIds]);

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
			map([...conversationIds], (conversationId) => {
				const active = itemId === conversationId;
				return (
					<SearchConversationListItem
						key={conversationId}
						active={active}
						conversationId={conversationId}
						selecting={false}
						activeItemId={''}
						count={count}
						setCount={setCount}
						items={conversations}
					/>
				);
			}),
		[conversationIds, conversations, count, itemId, setCount]
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
				<>
					<SearchConversationListHeader
						conversations={conversations}
						count={count}
						setCount={setCount}
						items={items}
					/>
					<Divider color="gray2" />
					{totalConversations > 0 || hasMore ? (
						<CustomList
							onListBottom={(): void => {
								onScrollBottom();
							}}
							data-testid={`conversation-list-${folderId}`}
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
		</Container>
	);
};
