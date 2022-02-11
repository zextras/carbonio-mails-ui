/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { Button, Container, List, Padding, Text, Tooltip } from '@zextras/carbonio-design-system';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import SearchListItem from './search-list-item';
import ShimmerList from './shimmer-list';

const BorderContainer = styled(Container)`
	border-bottom: 1px solid ${({ theme }) => theme?.palette?.gray2?.regular};
	border-right: 1px solid ${({ theme }) => theme?.palette?.gray2?.regular};
`;
const InvalidSearchMessage = styled(Text)`
	text-align: center;
	font-size: ${({ theme }) => theme?.sizes?.font?.small};
`;

const SearchList = ({
	searchResults,
	search,
	query,
	loading,
	filterCount,
	setShowAdvanceFilters,
	isInvalidQuery,
	searchDisabled
}) => {
	const [t] = useTranslation();
	const { itemId } = useParams();
	const loadMore = useCallback(() => {
		if (searchResults && searchResults.conversations.length > 0 && searchResults.more) {
			search(query, false);
		}
	}, [query, search, searchResults]);

	const canLoadMore = useMemo(
		() => !loading && searchResults && searchResults.conversations.length > 0 && searchResults.more,
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
	}, [searchResults?.conversations.length, query]);
	const displayerTitle = useMemo(() => {
		if (!isInvalidQuery && searchResults?.conversations.length === 0) {
			if (randomListIndex === 0) {
				return t(
					'displayer.search_list_title1',
					'It looks like there are no results. Keep searching!'
				);
			}
			return t('displayer.search_list_title2', 'None of your items matches your search.');
		}
		return null;
	}, [randomListIndex, t, isInvalidQuery, searchResults?.conversations.length]);
	return (
		<Container background="gray6" width="25%" height="fill" mainAlignment="flex-start">
			<BorderContainer
				padding={{ all: 'small' }}
				height="fit"
				mainAlignment="flex-start"
				crossAlignment="flex-start"
				borderRadius="none"
			>
				<Tooltip
					label={t(
						'label.results_for_error',
						'Unable to parse the search query, clear it and retry'
					)}
					placement="top"
					maxWidth="100%"
					disabled={!searchDisabled}
				>
					<Button
						onClick={() => setShowAdvanceFilters(true)}
						type={filterCount > 0 ? 'default' : 'outlined'}
						size="fill"
						label={
							filterCount === 0
								? t('label.single_advanced_filter', 'Advanced Filters')
								: t('label.advanced_filters', {
										count: filterCount,
										defaultValue: '{{count}} Advanced Filter',
										defaultValue_plural: '{{count}} Advanced Filters'
								  })
						}
						disabled={searchDisabled}
						icon="Options2Outline"
					/>
				</Tooltip>
			</BorderContainer>
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
			{loading && <ShimmerList />}

			{!isInvalidQuery && searchResults?.conversations.length > 0 && !loading && (
				<Container style={{ overflowY: 'auto' }} mainAlignment="flex-start">
					<List
						items={searchResults?.conversations ?? []}
						ItemComponent={SearchListItem}
						onListBottom={canLoadMore ? loadMore : undefined}
						active={itemId}
					/>
				</Container>
			)}

			{!isInvalidQuery && searchResults?.conversations.length === 0 && !loading && (
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
export default SearchList;
