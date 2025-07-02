/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC, useMemo, useRef } from 'react';

import { Container, Padding, Text } from '@zextras/carbonio-design-system';
import { t, useAppContext } from '@zextras/carbonio-shell-ui';
import { CustomList, CustomListItem } from '@zextras/carbonio-ui-commons';
import { map } from 'lodash';
import { useParams } from 'react-router-dom';

import { useSelection } from 'hooks/use-selection';
import type { AppContext, SearchListProps } from 'types/index.d';
import { MessagesMultipleSelectionActions } from 'views/app/folder-panel/messages/messages-multiple-selection-actions';
import { SearchMessageListItemWrapper } from 'views/search/list/message/search-message-list-item-wrapper';
import { SearchListHeader } from 'views/search/list/parts/search-list-header';
import { useLoadMoreForSearchSlice } from 'views/search/search-view-hooks';
import ShimmerList from 'views/search/shimmer-list';

export const SearchMessageList: FC<SearchListProps> = ({
	searchResults: messageIds,
	query,
	loading,
	isInvalidQuery,
	hasMore,
	searchResultsStatus
}) => {
	const { itemId } = useParams<{ itemId: string }>();
	const loadingMore = useRef<boolean>(false);
	const { setCount, count } = useAppContext<AppContext>();
	const listRef = useRef<HTMLDivElement>(null);
	const totalMessages = useMemo(() => messageIds.length, [messageIds]);

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
		items: messageIds
	});

	const displayerTitle = useMemo(() => {
		if (searchResultsStatus === 'fulfilled' && messageIds.length === 0 && !loading) {
			return t(
				'displayer.search_list_title1',
				'It looks like there are no results. Keep searching!'
			);
		}
		return null;
	}, [searchResultsStatus, messageIds, loading]);

	const onScrollBottom = useLoadMoreForSearchSlice({
		query,
		offset: totalMessages,
		hasMore,
		loadingMore,
		types: 'message'
	});

	const listItems = useMemo(
		() =>
			map(messageIds, (messageId) => {
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
								<SearchMessageListItemWrapper
									key={messageId}
									messageId={messageId}
									selected={isSelected}
									selecting={isSelectModeOn}
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

	const selectedIds = useMemo(() => Object.keys(selected), [selected]);

	return (
		<>
			{!isInvalidQuery && !loading && (
				<SearchListHeader
					itemIds={messageIds}
					selected={selected}
					deselectAll={deselectAll}
					isSelectModeOn={isSelectModeOn}
					setIsSelectModeOn={setIsSelectModeOn}
					selectAll={selectAll}
					isAllSelected={isAllSelected}
					selectAllModeOff={selectAllModeOff}
				>
					<MessagesMultipleSelectionActions
						ids={selectedIds}
						deselectAll={deselectAll}
						folderId={''}
					/>
				</SearchListHeader>
			)}

			{!loading && (
				<>
					{totalMessages > 0 || hasMore ? (
						<CustomList
							onListBottom={onScrollBottom}
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
		</>
	);
};
