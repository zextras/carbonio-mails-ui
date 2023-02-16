/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Container, ListV2, Padding, Text } from '@zextras/carbonio-design-system';
import { isEmpty, map, sortBy } from 'lodash';
import { t } from '@zextras/carbonio-shell-ui';
import { CustomListItem } from '../../carbonio-ui-commons/components/list/list-item';
import ShimmerList from './shimmer-list';
import { AdvancedFilterButton } from './parts/advanced-filter-button';
import { SearchMessageListItem } from './search-message-list-item';
import { SearchListProps } from '../../types';

const SearchMessageList: FC<SearchListProps> = ({
	searchDisabled,
	searchResults,
	search,
	query,
	loading,
	filterCount,
	setShowAdvanceFilters,
	isInvalidQuery,
	invalidQueryTooltip
}) => {
	const { itemId } = useParams<{ itemId: string; folderId: string }>();

	const canLoadMore = useMemo(
		() => !loading && searchResults && !isEmpty(searchResults.messages) && searchResults.more,
		[loading, searchResults]
	);

	const loadMore = useCallback(() => {
		if (searchResults && !isEmpty(searchResults.conversations) && searchResults.more) {
			search(query, false);
		}
	}, [query, search, searchResults]);

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
		if (!isInvalidQuery && isEmpty(searchResults.messages)) {
			if (randomListIndex === 0) {
				return t(
					'displayer.search_list_title1',
					'It looks like there are no results. Keep searching!'
				);
			}
			return t('displayer.search_list_title2', 'None of your items matches your search.');
		}
		return null;
	}, [isInvalidQuery, searchResults.messages, randomListIndex]);

	const tooltipDisabled = !searchDisabled || !invalidQueryTooltip;
	const messageList = useMemo(
		() => sortBy(Object.values(searchResults?.messages ?? []), 'date').reverse(),
		[searchResults?.messages]
	);

	const listItems = useMemo(
		() =>
			map(messageList, (message) => {
				const isActive = itemId === message.id;
				return (
					<CustomListItem
						key={message.id}
						active={isActive}
						background={message.read ? 'gray6' : 'gray5'}
					>
						{(): JSX.Element => (
							<SearchMessageListItem item={message} isConvChildren={false} active={isActive} />
						)}
					</CustomListItem>
				);
			}),
		[itemId, messageList]
	);

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
			{searchResults?.messages ? (
				<ListV2
					style={{ paddingBottom: '0.25rem' }}
					onListBottom={canLoadMore ? loadMore : undefined}
					data-testid={`search-message-list`}
				>
					{listItems}
				</ListV2>
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
			{loading && <ShimmerList count={33} delay={0} />}
		</Container>
	);
};
export default SearchMessageList;
