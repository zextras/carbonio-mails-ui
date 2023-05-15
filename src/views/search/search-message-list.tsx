/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { Container, Padding, Text } from '@zextras/carbonio-design-system';
import { t, useAppContext } from '@zextras/carbonio-shell-ui';
import { isArray, isEmpty, map, noop, sortBy } from 'lodash';
import React, { FC, ReactElement, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useSelection } from '../../hooks/use-selection';
import type { AppContext, SearchListProps } from '../../types';
import { MessageListComponent } from '../app/folder-panel/messages/message-list-component';
import { MessageListItemComponent } from '../app/folder-panel/messages/message-list-item-component';
import { AdvancedFilterButton } from './parts/advanced-filter-button';
import ShimmerList from './shimmer-list';
import { CustomListItem } from '../../carbonio-ui-commons/components/list/list-item';

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
		() => sortBy(Object.values(searchResults?.messages ?? []), 'date').reverse(),
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
						{(visible: boolean): ReactElement => (
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
						)}
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
			{searchResults?.messages ? (
				<MessageListComponent
					totalMessages={totalMessages}
					displayerTitle={displayerTitle}
					listItems={listItems}
					messagesLoadingCompleted={messagesLoadingCompleted}
					selectedIds={selectedIds}
					folderId={folderId}
					messages={messages}
					isSelectModeOn={isSelectModeOn}
					isAllSelected={isAllSelected}
					selectAll={selectAll}
					deselectAll={deselectAll}
					selected={selected}
					selectAllModeOff={selectAllModeOff}
					isSearchModule
					setDraggedIds={noop}
				/>
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
