/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC, useMemo, useRef } from 'react';

import { Container, Padding, Text } from '@zextras/carbonio-design-system';
import { t } from '@zextras/carbonio-shell-ui';
import { CustomList, CustomListItem } from '@zextras/carbonio-ui-commons';
import { map } from 'lodash';
import { useParams } from 'react-router-dom';

import { useMultipleSelection } from 'hooks/use-multiple-selection';
import { SearchListProps } from 'types/search';
import { MessageShortcutsRegister } from 'views/app/folder-panel/messages/message-shortcuts-register';
import { MultipleSelectionActions } from 'views/app/folder-panel/parts/multiple-selection-actions';
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
	const listRef = useRef<HTMLDivElement>(null);
	const totalMessages = useMemo(() => messageIds.length, [messageIds]);

	const [selectedItems, setSelectedItems] = React.useState<Set<string>>(new Set());
	const [lastSelectedIndex, setLastSelectedIndex] = React.useState<number | null>(null);

	const {
		deselectAll,
		isSelectModeOn,
		setIsSelectModeOn,
		selectAll,
		isAllSelected,
		selectAllModeOff,
		selectRange
	} = useMultipleSelection({
		allAvailableItems: messageIds,
		selectedItems,
		setSelectedItems,
		lastSelectedIndex,
		setLastSelectedIndex
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

	const selectedIdsArray = useMemo(() => Array.from(selectedItems), [selectedItems]);
	const keyboardShortcutsIds =
		selectedItems.size > 0 ? selectedIdsArray : ([itemId].filter(Boolean) as Array<string>);

	const listItems = useMemo(
		() =>
			map(messageIds, (messageId, index) => {
				const active = itemId === messageId;
				const isSelected = selectedItems.has(messageId);
				return (
					<CustomListItem
						key={messageId}
						selected={isSelected}
						active={active}
						background={'transparent'}
					>
						{(visible: boolean): React.JSX.Element =>
							visible ? (
								<>
									{(active || isSelected) && (
										<MessageShortcutsRegister messageIds={keyboardShortcutsIds} folderId={''} />
									)}
									<SearchMessageListItemWrapper
										key={messageId}
										messageId={messageId}
										selected={isSelected}
										selecting={isSelectModeOn}
										onSelect={selectRange}
										index={index}
										active={active}
									/>
								</>
							) : (
								<div style={{ height: '4rem' }} data-testid={`invisible-message-${messageId}`} />
							)
						}
					</CustomListItem>
				);
			}),
		[isSelectModeOn, itemId, keyboardShortcutsIds, messageIds, selectRange, selectedItems]
	);

	const selectedIds = useMemo(() => Array.from(selectedItems), [selectedItems]);

	return (
		<>
			{!isInvalidQuery && !loading && (
				<SearchListHeader
					itemIds={messageIds}
					selectedItems={selectedItems}
					deselectAll={deselectAll}
					isSelectModeOn={isSelectModeOn}
					setIsSelectModeOn={setIsSelectModeOn}
					selectAll={selectAll}
					isAllSelected={isAllSelected}
					selectAllModeOff={selectAllModeOff}
				>
					<MultipleSelectionActions type="message" ids={selectedIds} folderId={''} />
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
