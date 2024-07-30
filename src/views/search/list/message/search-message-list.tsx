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

import { SearchMessageListItem } from './search-message-list-item';
import { CustomList } from '../../../../carbonio-ui-commons/components/list/list';
import { LIST_LIMIT } from '../../../../constants';
import { useAppDispatch } from '../../../../hooks/redux';
import { useSelection } from '../../../../hooks/use-selection';
import { search } from '../../../../store/actions';
import type { AppContext, SearchListProps } from '../../../../types';
import { MultipleSelectionActionsPanel } from '../../../../ui-actions/multiple-selection-actions-panel';
import { Breadcrumbs } from '../../../app/folder-panel/parts/breadcrumbs';
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
					<SearchMessageListItem
						itemId={messageId}
						key={messageId}
						selected={isSelected}
						selecting={isSelectModeOn}
						isConvChildren={false}
						toggle={toggle}
						active={active}
						isSearchModule
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
	const selectedIds = useMemo(() => Object.keys(selected), [selected]);
	const messages = useMemo(() => [...searchResults].map((id) => ({ id })), [searchResults]);
	const showBreadcrumbs = useMemo(() => totalMessages > 0, [totalMessages]);
	const onListBottom = useCallback((): void => {
		onScrollBottom();
	}, [onScrollBottom]);
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
			{isSelectModeOn ? (
				<MultipleSelectionActionsPanel
					items={messages}
					selectedIds={selectedIds}
					deselectAll={deselectAll}
					selectAll={selectAll}
					isAllSelected={isAllSelected}
					selectAllModeOff={selectAllModeOff}
					setIsSelectModeOn={setIsSelectModeOn}
					folderId={folderId}
				/>
			) : (
				showBreadcrumbs && (
					<Breadcrumbs
						folderPath={''}
						itemsCount={totalMessages}
						isSelectModeOn={isSelectModeOn}
						setIsSelectModeOn={setIsSelectModeOn}
						folderId={folderId}
						isSearchModule
					/>
				)
			)}
			{messagesLoadingCompleted && (
				<>
					{totalMessages > 0 || hasMore ? (
						<CustomList
							onListBottom={onListBottom}
							data-testid={`message-list-${folderId}`}
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
