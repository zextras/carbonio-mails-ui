/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { Container, List, Padding, Text } from '@zextras/carbonio-design-system';
import { t } from '@zextras/carbonio-shell-ui';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';
import { filter, isEmpty, sortBy } from 'lodash';
import SearchConversationListItem from './search-conversation-list-item';
import ShimmerList from './shimmer-list';
import { AdvancedFilterButton } from './parts/advanced-filter-button';
import { SearchListProps } from '../../types';

const InvalidSearchMessage = styled(Text)`
	text-align: center;
	font-size: ${({ theme }): string => theme?.sizes?.font?.small};
`;

const SearchConversationList: FC<SearchListProps> = ({
	searchResults,
	search,
	query,
	loading,
	filterCount,
	setShowAdvanceFilters,
	isInvalidQuery,
	searchDisabled
}) => {
	const { itemId } = useParams<{ itemId: string }>();
	const loadMore = useCallback(() => {
		if (searchResults && !isEmpty(searchResults.conversations) && searchResults.more) {
			search(query, false);
		}
	}, [query, search, searchResults]);

	const canLoadMore = useMemo(
		() => !loading && searchResults && !isEmpty(searchResults.conversations) && searchResults.more,
		[loading, searchResults]
	);
	const [randomListIndex, setRandomListIndex] = useState(0);
	useEffect(() => {
		if (randomListIndex === 0) {
			setRandomListIndex(1);
		} else {
			setRandomListIndex(0);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [searchResults.conversations, query]);

	const displayerTitle = useMemo(() => {
		if (!isInvalidQuery && isEmpty(searchResults.conversations)) {
			if (randomListIndex === 0) {
				return t(
					'displayer.search_list_title1',
					'It looks like there are no results. Keep searching!'
				);
			}
			return t('displayer.search_list_title2', 'None of your items matches your search.');
		}
		return null;
	}, [isInvalidQuery, searchResults.conversations, randomListIndex]);

	const conversationList = useMemo(
		() => sortBy(filter(Object.values(searchResults?.conversations ?? [])), 'date').reverse(),
		[searchResults?.conversations]
	);

	return (
		<Container background="gray6" width="25%" height="fill" mainAlignment="flex-start">
			<AdvancedFilterButton
				setShowAdvanceFilters={setShowAdvanceFilters}
				filterCount={filterCount}
				searchDisabled={searchDisabled}
			/>
			{isInvalidQuery && (
				<Container maxHeight="fill" crossAlignment="center">
					<Text color="secondary" size="large" weight="bold">
						{t('label.no_search_results_found', 'No results found')}
					</Text>
					<Padding value="medium extralarge extralarge extralarge">
						<InvalidSearchMessage color="secondary" overflow="break-word">
							{t(`message.invalid_search_message`, `We didn't find any match`)}
						</InvalidSearchMessage>
					</Padding>
				</Container>
			)}
			{loading && <ShimmerList count={33} delay={0} />}
			{!isInvalidQuery && !isEmpty(searchResults?.conversations) && !loading && (
				<Container style={{ overflowY: 'auto' }} mainAlignment="flex-start">
					<List
						items={conversationList}
						// eslint-disable-next-line @typescript-eslint/ban-ts-comment
						// @ts-ignore
						ItemComponent={SearchConversationListItem}
						onListBottom={canLoadMore ? loadMore : undefined}
						active={itemId}
					/>
				</Container>
			)}
			{!isInvalidQuery && isEmpty(searchResults?.conversations) && !loading && (
				<Container>
					<Padding top="medium">
						<Text
							color="gray1"
							overflow="break-word"
							size="small"
							style={{ whiteSpace: 'pre-line', textAlign: 'center' }}
						>
							{displayerTitle}
						</Text>
					</Padding>
				</Container>
			)}
		</Container>
	);
};
export default SearchConversationList;
