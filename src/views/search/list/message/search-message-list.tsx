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

import { CustomList, CustomListItem } from '@zextras/carbonio-ui-commons';
import { useSelection } from '../../../../hooks/use-selection';
import type { AppContext, SearchListProps } from '../../../../types';
import { MessagesMultipleSelectionActions } from '../../../app/folder-panel/messages/messages-multiple-selection-actions';
import { AdvancedFilterButton } from '../../parts/advanced-filter-button';
import { useLoadMoreForSearchSlice } from '../../search-view-hooks';
import ShimmerList from '../../shimmer-list';
import { SearchListHeader } from '../parts/search-list-header';
import { SearchMessageListItemWrapper } from './search-message-list-item-wrapper';

export const SearchMessageList: FC<SearchListProps> = ({
	searchDisabled,
	searchResults: messageIds,
	query,
	loading,
	setShowAdvanceFilters,
	isInvalidQuery,
	invalidQueryTooltip,
	hasMore
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
		if (!isInvalidQuery) return null;

		if (totalMessages === 0) {
			return t(
				'displayer.search_list_title1',
				'It looks like there are no results. Keep searching!'
			);
		}
		return null;
	}, [isInvalidQuery, totalMessages]);

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
		<Container
			background={'gray6'}
			width="25%"
			height="fill"
			mainAlignment="flex-start"
			data-testid="MailsSearchResultListContainer"
		>
			<AdvancedFilterButton
				setShowAdvanceFilters={setShowAdvanceFilters}
				searchDisabled={searchDisabled}
				invalidQueryTooltip={invalidQueryTooltip}
			/>

			{!isInvalidQuery && !loading && (
				<>
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
		</Container>
	);
};
