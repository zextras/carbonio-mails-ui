/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, {
	FC,
	ReactElement,
	useCallback,
	useEffect,
	useLayoutEffect,
	useMemo,
	useRef,
	useState
} from 'react';

import { Container } from '@zextras/carbonio-design-system';
import { t, useAppContext } from '@zextras/carbonio-shell-ui';
import { isArray, isEmpty, map, noop, sortBy } from 'lodash';
import { useParams } from 'react-router-dom';

import { AdvancedFilterButton } from './parts/advanced-filter-button';
import ShimmerList from './shimmer-list';
import { CustomListItem } from '../../carbonio-ui-commons/components/list/list-item';
import { LIST_LIMIT } from '../../constants';
import { useAppDispatch } from '../../hooks/redux';
import { useSelection } from '../../hooks/use-selection';
import { search } from '../../store/actions/search';
import type { AppContext, SearchListProps } from '../../types';
import { MessageListComponent } from '../app/folder-panel/messages/message-list-component';
import { MessageListItemComponent } from '../app/folder-panel/messages/message-list-item-component';

export const SearchMessageList: FC<SearchListProps> = ({
	searchDisabled,
	searchResults,
	query,
	loading,
	filterCount,
	setShowAdvanceFilters,
	isInvalidQuery,
	invalidQueryTooltip
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
		currentFolderId: folderId,
		setCount,
		count,
		items: [...Object.values(searchResults.messages ?? {})]
	});

	const [randomListIndex, setRandomListIndex] = useState(0);
	const [isLoading, setIsLoading] = useState(false);
	const listRef = useRef<HTMLDivElement>(null);
	const dispatch = useAppDispatch();

	useEffect(() => {
		setRandomListIndex(Math.round(Math.random()));
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

	const messageList = useMemo(
		() => sortBy(Object.values(searchResults?.messages ?? []), 'sortIndex'),

		[searchResults?.messages]
	);

	const listItems = useMemo(
		() =>
			map(messageList, (message) => {
				const active = itemId === message.id;
				const isSelected = selected[message.id];
				return (
					<CustomListItem
						key={message.id}
						selected={isSelected}
						active={active}
						background={message.read ? 'gray6' : 'gray5'}
					>
						{(visible: boolean): ReactElement =>
							visible ? (
								<MessageListItemComponent
									message={message}
									selected={selected}
									isSelected={isSelected}
									active={active}
									toggle={toggle}
									isSelectModeOn={isSelectModeOn}
									isSearchModule
									deselectAll={deselectAll}
									visible={visible}
								/>
							) : (
								<div style={{ height: '4rem' }} data-testid={`invisible-message-${message.id}`} />
							)
						}
					</CustomListItem>
				);
			}),
		[deselectAll, isSelectModeOn, itemId, messageList, selected, toggle]
	);

	const totalMessages = useMemo(() => {
		if (searchResults && searchResults.messages) {
			return Object.keys(searchResults.messages).length;
		}
		return 0;
	}, [searchResults]);

	useLayoutEffect(() => {
		listRef?.current && (listRef.current.children[0].scrollTop = 0);
	}, [searchResults.query]);

	const onScrollBottom = useCallback(() => {
		if (searchResults.more && !isLoading) {
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
	}, [dispatch, isLoading, query, searchResults, totalMessages]);

	const messagesLoadingCompleted = useMemo(
		() => !isArray(searchResults?.messages),
		[searchResults?.messages]
	);
	const selectedIds = useMemo(() => Object.keys(selected), [selected]);
	const messages = useMemo(
		() => Object.values(searchResults?.messages ?? {}),
		[searchResults?.messages]
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
			<MessageListComponent
				totalMessages={totalMessages}
				displayerTitle={displayerTitle}
				listItems={listItems}
				messagesLoadingCompleted={messagesLoadingCompleted}
				selectedIds={selectedIds}
				folderId={folderId}
				messages={messages}
				isSelectModeOn={isSelectModeOn}
				setIsSelectModeOn={setIsSelectModeOn}
				isAllSelected={isAllSelected}
				selectAll={selectAll}
				deselectAll={deselectAll}
				selected={selected}
				selectAllModeOff={selectAllModeOff}
				isSearchModule
				setDraggedIds={noop}
				loadMore={onScrollBottom}
				listRef={listRef}
			/>
			{loading && <ShimmerList count={33} delay={0} />}
		</Container>
	);
};
