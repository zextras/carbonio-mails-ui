/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, useLayoutEffect, useMemo, useRef } from 'react';

import { Container, Padding, Text } from '@zextras/carbonio-design-system';
import { t, useAppContext } from '@zextras/carbonio-shell-ui';
import { isEmpty, map } from 'lodash';
import { useParams } from 'react-router-dom';

import { SearchConversationListItem } from './search-conversation-list-item';
import { CustomList } from '../../../../carbonio-ui-commons/components/list/list';
import { CustomListItem } from '../../../../carbonio-ui-commons/components/list/list-item';
import { useSelection } from '../../../../hooks/use-selection';
import type { AppContext, SearchListProps } from '../../../../types';
import { Divider } from '../../../app/detail-panel/edit/parts/edit-view-styled-components';
import { AdvancedFilterButton } from '../../parts/advanced-filter-button';
import { useLoadMoreConversations } from '../../search-view-hooks';
import ShimmerList from '../../shimmer-list';
import { SearchListHeader } from '../parts/search-list-header';

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
	const randomListIndex = useMemo(() => Math.floor(Math.random() * 2), []);
	const listRef = useRef<HTMLDivElement>(null);
	const totalConversations = useMemo(() => conversationIds.size, [conversationIds]);

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
		if (isInvalidQuery) {
			return null;
		}
		if (isEmpty(conversationIds)) {
			if (randomListIndex === 0) {
				return t(
					'displayer.search_list_title1',
					'It looks like there are no results. Keep searching!'
				);
			}
			return t('displayer.search_list_title2', 'None of your items matches your search.');
		}
		return null;
	}, [isInvalidQuery, conversationIds, randomListIndex]);

	useLayoutEffect(() => {
		listRef?.current && (listRef.current.children[0].scrollTop = 0);
	}, [conversationIds]);

	const onScrollBottom = useLoadMoreConversations({ query, offset: totalConversations, hasMore });

	const listItems = useMemo(
		() =>
			map([...conversationIds], (conversationId) => {
				const active = itemId === conversationId;
				const isSelected = selected[conversationId];
				return (
					// WARNING: CustomList needs a CustomListItem as top-level children, else visibility breaks
					<CustomListItem
						active={active}
						selected={isSelected}
						key={conversationId}
						background={'transparent'}
					>
						{(visible: boolean): React.JSX.Element =>
							visible ? (
								<SearchConversationListItem
									key={conversationId}
									active={active}
									conversationId={conversationId}
									selecting={isSelectModeOn}
									activeItemId={itemId}
									toggle={toggle}
									selected={isSelected}
									deselectAll={deselectAll}
								/>
							) : (
								<div
									style={{ height: '4rem' }}
									data-testid={`invisible-conversation-${conversationId}`}
								/>
							)
						}
					</CustomListItem>
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
				<>
					<SearchListHeader
						items={items}
						folderId={folderId}
						selected={selected}
						deselectAll={deselectAll}
						isSelectModeOn={isSelectModeOn}
						setIsSelectModeOn={setIsSelectModeOn}
						selectAll={selectAll}
						isAllSelected={isAllSelected}
						selectAllModeOff={selectAllModeOff}
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
