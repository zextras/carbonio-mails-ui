/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC, useMemo, useRef } from 'react';

import { Container, Padding, Text } from '@zextras/carbonio-design-system';
import { t, useAppContext } from '@zextras/carbonio-shell-ui';
import { map } from 'lodash';
import { useParams } from 'react-router-dom';

import { SearchMessageListItem } from './search-message-list-item';
import { CustomList } from '../../../../carbonio-ui-commons/components/list/list';
import { CustomListItem } from '../../../../carbonio-ui-commons/components/list/list-item';
import { useSelection } from '../../../../hooks/use-selection';
import type { AppContext, SearchListProps } from '../../../../types';
import { AdvancedFilterButton } from '../../parts/advanced-filter-button';
import { useLoadMore } from '../../search-view-hooks';
import ShimmerList from '../../shimmer-list';
import { SearchListHeader } from '../parts/search-list-header';

export const SearchMessageList: FC<SearchListProps> = ({
	searchDisabled,
	searchResults: messageIds,
	query,
	loading,
	filterCount,
	setShowAdvanceFilters,
	isInvalidQuery,
	invalidQueryTooltip,
	hasMore
}) => {
	const { itemId } = useParams<{ itemId: string }>();
	const loadingMore = useRef<boolean>(false);
	const { setCount, count } = useAppContext<AppContext>();
	const items = [...messageIds].map((messageId) => ({ id: messageId }));
	const listRef = useRef<HTMLDivElement>(null);
	const totalMessages = useMemo(() => messageIds.size, [messageIds]);

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
		items
	});

	const displayerTitle = useMemo(() => {
		if (!isInvalidQuery) return null;

		if (totalMessages === 0) {
			return t(
				'displayer.search_list_title1',
				'It looks like there are no results. Keep searching!'
			);
		}
		return null;
	}, [isInvalidQuery, totalMessages]);

	const onScrollBottom = useLoadMore({
		query,
		offset: totalMessages,
		hasMore,
		loadingMore,
		types: 'message'
	});

	const listItems = useMemo(
		() =>
			map([...messageIds], (messageId) => {
				const active = itemId === messageId;
				const isSelected = selected[messageId];
				return (
					<CustomListItem
						key={messageId}
						selected={isSelected}
						active={active}
						background={'transparent'}
					>
						{(visible: boolean): React.JSX.Element =>
							visible ? (
								<SearchMessageListItem
									itemId={messageId}
									key={messageId}
									selected={isSelected}
									selecting={isSelectModeOn}
									isConvChildren={false}
									toggle={toggle}
									active={active}
									deselectAll={deselectAll}
								/>
							) : (
								<div style={{ height: '4rem' }} data-testid={`invisible-message-${messageId}`} />
							)
						}
					</CustomListItem>
				);
			}),
		[deselectAll, isSelectModeOn, itemId, messageIds, selected, toggle]
	);

	return (
		<Container
			background={'gray6'}
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

			{!isInvalidQuery && !loading && (
				<>
					<SearchListHeader
						items={items}
						folderId={''}
						selected={selected}
						deselectAll={deselectAll}
						isSelectModeOn={isSelectModeOn}
						setIsSelectModeOn={setIsSelectModeOn}
						selectAll={selectAll}
						isAllSelected={isAllSelected}
						selectAllModeOff={selectAllModeOff}
					/>

					{totalMessages > 0 || hasMore ? (
						<CustomList
							onListBottom={(): void => {
								onScrollBottom();
							}}
							data-testid={`message-list-${itemId}`}
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
