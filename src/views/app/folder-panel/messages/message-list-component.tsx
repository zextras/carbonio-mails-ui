/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { memo, useMemo } from 'react';

import styled from '@emotion/styled';
import { Container, Padding, Text } from '@zextras/carbonio-design-system';
import { CustomList, useFolder, useRoot } from '@zextras/carbonio-ui-commons';

import { MultipleSelectionActions } from '../parts/multiple-selection-actions';
import { DragItems } from 'views/app/folder-panel/messages/message-list-drag-component';
import { Breadcrumbs } from 'views/app/folder-panel/parts/breadcrumbs';
import { MultipleSelectionActionsPanel } from 'views/app/folder-panel/parts/multiple-selection-actions-panel';
import { getFolderPath } from 'views/app/folder-panel/parts/utils/utils';
import ShimmerList from 'views/search/shimmer-list';

const DragImageContainer = styled.div`
	position: absolute;
	top: -312.5rem;
	left: -312.5rem;
	transform: translate(-100%, -100%);
	width: 35vw;
`;

export type MessageListComponentProps = {
	// the text to display in the side panel
	displayerTitle: string | null;
	// the list of messages to display
	listItems: React.JSX.Element[];
	// the function to call when the list is scrolled to the bottom
	loadMoreCallback?: () => void;
	// the total number of messages in the list
	totalMessages: number;
	// true if the call has been fulfilled
	messagesLoadingCompleted: boolean;
	// the ids of the selected messages
	selectedIds: string[];
	// the id of the current folder
	folderId: string;
	// the messages to display
	messageIds: Array<string>;
	// the ids of the messages being dragged
	draggedIds?: Record<string, boolean>;
	// true if the component is in the search module
	isSearchModule?: boolean;
	// true if the user is in select mode
	isSelectModeOn: boolean;
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
	// callback to be executed after any action that moves messages (to trash, to folder, etc.)
	onMessagesMoved?: (messagesIds: Array<string>) => void;
};

export const MessageListComponent = memo(function MessageListComponent({
	displayerTitle,
	listItems,
	loadMoreCallback,
	totalMessages,
	messagesLoadingCompleted,
	selectedIds,
	folderId,
	messageIds,
	onMessagesMoved,
	draggedIds,
	isSearchModule,
	isSelectModeOn,
	deselectAll,
	selectAll,
	isAllSelected,
	selectAllModeOff,
	setIsSelectModeOn,
	dragImageRef,
	listRef
}: MessageListComponentProps): React.JSX.Element {
	const folder = useFolder(folderId);
	const root = useRoot(folder?.id ?? '');
	const showBreadcrumbs = useMemo(
		() =>
			!isSearchModule ||
			typeof isSearchModule === 'undefined' ||
			(isSearchModule && totalMessages > 0),
		[isSearchModule, totalMessages]
	);

	const folderPath = useMemo(
		() => getFolderPath(folder, root, isSearchModule),
		[root, folder, isSearchModule]
	);

	return (
		<>
			{isSelectModeOn ? (
				<MultipleSelectionActionsPanel
					itemsIds={messageIds}
					selectedIds={selectedIds}
					deselectAll={deselectAll}
					selectAll={selectAll}
					isAllSelected={isAllSelected}
					selectAllModeOff={selectAllModeOff}
					setIsSelectModeOn={setIsSelectModeOn}
					folderId={folderId}
				>
					<MultipleSelectionActions
						type="message"
						ids={selectedIds}
						folderId={folderId}
						onItemsMoved={onMessagesMoved}
					/>
				</MultipleSelectionActionsPanel>
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
			<>
				{!messagesLoadingCompleted && <ShimmerList count={totalMessages} />}
				{messagesLoadingCompleted && (totalMessages > 0 || loadMoreCallback) && (
					<CustomList
						onListBottom={loadMoreCallback}
						data-testid={`message-list-${folderId}`}
						ref={listRef}
					>
						{listItems}
					</CustomList>
				)}
				{messagesLoadingCompleted && totalMessages === 0 && !loadMoreCallback && (
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
				<DragImageContainer ref={dragImageRef}>
					<DragItems draggedIds={draggedIds ?? {}} />
				</DragImageContainer>
			</>
		</>
	);
});
