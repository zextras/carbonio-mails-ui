/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, {
	FC,
	ReactElement,
	useCallback,
	useLayoutEffect,
	useMemo,
	useRef,
	useState
} from 'react';

import { Container, Padding, Text } from '@zextras/carbonio-design-system';
import { t, useAppContext } from '@zextras/carbonio-shell-ui';
import { isEmpty, map } from 'lodash';
import { useParams } from 'react-router-dom';

import { SearchMessageListItem } from './search-message-list-item';
import { CustomList } from '../../../../carbonio-ui-commons/components/list/list';
import { CustomListItem } from '../../../../carbonio-ui-commons/components/list/list-item';
import { LIST_LIMIT } from '../../../../constants';
import { useAppDispatch } from '../../../../hooks/redux';
import { useSelection } from '../../../../hooks/use-selection';
import { search } from '../../../../store/actions';
import type { AppContext, SearchListProps } from '../../../../types';
import { AdvancedFilterButton } from '../../parts/advanced-filter-button';
import ShimmerList from '../../shimmer-list';
import { SearchListHeader } from '../parts/search-list-header';

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
					<CustomListItem
						key={messageId}
						selected={isSelected}
						active={active}
						// TODO: need message to find out if it is read or not
						// background={completeMessage.read ? 'gray6' : 'gray5'}
						background={'transparent'}
					>
						{(visible: boolean): ReactElement =>
							visible ? (
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
							) : (
								<div style={{ height: '4rem' }} data-testid={`invisible-message-${messageId}`} />
							)
						}
					</CustomListItem>
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
	const messages = useMemo(() => [...searchResults].map((id) => ({ id })), [searchResults]);
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

			<SearchListHeader
				items={messages}
				folderId={folderId}
				selected={selected}
				deselectAll={deselectAll}
				isSelectModeOn={isSelectModeOn}
				setIsSelectModeOn={setIsSelectModeOn}
				selectAll={selectAll}
				isAllSelected={isAllSelected}
				selectAllModeOff={selectAllModeOff}
			/>

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
