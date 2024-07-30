/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, memo, useCallback, useEffect, useMemo } from 'react';

import { Container, Padding, Text } from '@zextras/carbonio-design-system';
import { noop } from 'lodash';

import { CustomList } from '../../../../carbonio-ui-commons/components/list/list';
import { useFolder } from '../../../../carbonio-ui-commons/store/zustand/folder';
import { MultipleSelectionActionsPanel } from '../../../../ui-actions/multiple-selection-actions-panel';
import { Breadcrumbs } from '../../../app/folder-panel/parts/breadcrumbs';
import ShimmerList from '../../shimmer-list';

type SearchMessageListComponentProps = {
	// the text to display in the side panel
	displayerTitle: string | null;
	// the list of messages to display
	listItems: React.JSX.Element[];
	// the function to call when the list is scrolled to the bottom
	loadMore?: () => void;
	// the total number of messages in the list
	totalMessages: number;
	// true if the call has been fulfilled
	messagesLoadingCompleted: boolean;
	// the ids of the selected messages
	selectedIds: string[];
	// the id of the current folder
	folderId: string;
	// the messages to display
	messages: Array<{ id: string }>;
	// the ids of the messages being dragged
	draggedIds?: Record<string, boolean>;
	// the function to call when the user starts dragging a message
	setDraggedIds: (ids: Record<string, boolean>) => void;
	// true if the component is in the search module
	isSearchModule?: boolean;
	// true if the user is in select mode
	isSelectModeOn: boolean;
	// the selected messages
	selected: Record<string, boolean>;
	// the function to call when the user deselects all messages
	deselectAll: () => void;
	// the function to call when the user selects all messages
	selectAll: () => void;
	// true if all messages are selected
	isAllSelected: boolean;
	// the function to call when the user deselects all messages
	selectAllModeOff: () => void;
	// the function to call when the user toggles select mode
	setIsSelectModeOn: (ev: boolean | ((prevState: boolean) => boolean)) => void;
	// the ref to the item being dragged
	dragImageRef?: React.RefObject<HTMLInputElement>;
	listRef?: React.RefObject<HTMLDivElement>;
	hasMore?: boolean;
};

export const SearchMessageListComponent: FC<SearchMessageListComponentProps> = memo(
	function MessageListComponent({
		displayerTitle,
		listItems,
		loadMore = noop,
		totalMessages,
		messagesLoadingCompleted,
		selectedIds,
		folderId,
		messages,
		draggedIds,
		setDraggedIds,
		isSearchModule,
		isSelectModeOn,
		selected,
		deselectAll,
		selectAll,
		isAllSelected,
		selectAllModeOff,
		setIsSelectModeOn,
		dragImageRef,
		hasMore,
		listRef
	}) {
		useEffect(() => {
			setDraggedIds && setDraggedIds(selected);
		}, [selected, setDraggedIds]);

		const folder = useFolder(folderId);
		const showBreadcrumbs = useMemo(
			() =>
				!isSearchModule ||
				typeof isSearchModule === 'undefined' ||
				(isSearchModule && totalMessages > 0),
			[isSearchModule, totalMessages]
		);

		const folderPath = useMemo(() => {
			if (isSearchModule) {
				return '';
			}
			return folder?.absFolderPath?.split('/')?.join(' / ') ?? '';
		}, [folder?.absFolderPath, isSearchModule]);

		const onListBottom = useCallback((): void => {
			loadMore && loadMore();
		}, [loadMore]);

		return (
			<>
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
							folderPath={folderPath}
							itemsCount={totalMessages}
							isSelectModeOn={isSelectModeOn}
							setIsSelectModeOn={setIsSelectModeOn}
							folderId={folderId}
							isSearchModule={isSearchModule}
						/>
					)
				)}
				{messagesLoadingCompleted ? (
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
				) : (
					<ShimmerList count={totalMessages} />
				)}
			</>
		);
	}
);
