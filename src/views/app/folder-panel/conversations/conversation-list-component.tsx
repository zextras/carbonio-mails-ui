/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { RefObject, memo, useMemo } from 'react';

import { Container, Divider, Padding, Text } from '@zextras/carbonio-design-system';
import { CustomList, useFolder, useRoot } from '@zextras/carbonio-ui-commons';
import { map, noop } from 'lodash';
import styled from 'styled-components';

import { getConversationById } from 'store/emails/store';
import { ConversationListItemComponent } from 'views/app/folder-panel/conversations/conversation-list-item-component';
import { ConversationsMultipleSelectionActions } from 'views/app/folder-panel/conversations/conversations-multiple-selection-actions';
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

const DragItems = ({
	draggedIds,
	deselectAll
}: {
	draggedIds: Record<string, boolean>;
	deselectAll: () => void;
}): React.JSX.Element => (
	<>
		{map(
			Object.keys(draggedIds)
				.map((draggedId) => getConversationById(draggedId))
				.filter(Boolean),
			(conversation) => (
				<ConversationListItemComponent
					deselectAll={deselectAll}
					selectedItems={{}}
					conversationId={conversation.id}
					key={conversation.id}
					draggedIds={draggedIds}
					activeItemId={conversation.id}
					selected={false}
					selecting={false}
					toggleMultipleSelection={noop}
					selectedIds={[]}
					folderId=""
					setDraggedIds={noop}
				/>
			)
		)}
	</>
);

export type ConversationListComponentProps = {
	// the text to display in the side panel
	displayerTitle: string | null;
	// the list of conversations to display
	listItems: React.JSX.Element[];
	// the function to call when the list is scrolled to the bottom
	totalConversations: number;
	// true if the call has been fulfilled
	conversationsLoadingCompleted: boolean;
	// the ids of the selected conversations
	selectedIds: string[];
	// the id of the current folder
	folderId: string;
	// the conversations to display
	conversationsIds: Array<string>;
	// the ids of the conversations being dragged
	draggedIds?: Record<string, boolean>;
	// true if the component is in the search module
	isSearchModule?: boolean;
	// true if the user is in select mode
	isSelectModeOn: boolean;
	// the selected conversations
	selected: Record<string, boolean>;
	// the function to call when the user deselects all conversations
	deselectAll: () => void;
	// the function to call when the user selects all conversations
	selectAll: () => void;
	// true if all conversations are selected
	isAllSelected: boolean;
	// the function to call when the user deselects all conversations
	selectAllModeOff: () => void;
	// the function to call when the user toggles select mode
	setIsSelectModeOn: (ev: boolean | ((prevState: boolean) => boolean)) => void;
	// the reference to the dragged item
	dragImageRef?: RefObject<HTMLInputElement>;
	listRef?: React.RefObject<HTMLDivElement>;
	loadMoreCallback?: () => void;
};

export const ConversationListComponent = memo(function ConversationListComponent({
	displayerTitle,
	isSearchModule,
	isSelectModeOn,
	folderId,
	conversationsIds,
	selected,
	deselectAll,
	selectAll,
	isAllSelected,
	selectAllModeOff,
	setIsSelectModeOn,
	conversationsLoadingCompleted,
	draggedIds,
	listItems,
	totalConversations,
	dragImageRef,
	listRef,
	loadMoreCallback
}: ConversationListComponentProps): React.JSX.Element {
	const folder = useFolder(folderId);
	const root = useRoot(folder?.id ?? '');

	const folderPath = useMemo(
		() => getFolderPath(folder, root, isSearchModule),
		[root, folder, isSearchModule]
	);

	const showBreadcrumbs = useMemo(
		() =>
			!isSearchModule ||
			typeof isSearchModule === 'undefined' ||
			(isSearchModule && totalConversations > 0),
		[isSearchModule, totalConversations]
	);

	const selectedIds = useMemo(() => Object.keys(selected), [selected]);

	return (
		<>
			{isSelectModeOn ? (
				<MultipleSelectionActionsPanel
					itemsIds={conversationsIds}
					folderId={folderId}
					selectedIds={selectedIds}
					deselectAll={deselectAll}
					selectAll={selectAll}
					isAllSelected={isAllSelected}
					selectAllModeOff={selectAllModeOff}
					setIsSelectModeOn={setIsSelectModeOn}
				>
					<ConversationsMultipleSelectionActions
						selectedConversationsIds={selectedIds}
						folderId={folderId}
					/>
				</MultipleSelectionActionsPanel>
			) : (
				showBreadcrumbs && (
					<Breadcrumbs
						folderPath={folderPath}
						itemsCount={totalConversations}
						isSelectModeOn={isSelectModeOn}
						setIsSelectModeOn={setIsSelectModeOn}
						folderId={folderId}
						isSearchModule={isSearchModule}
					/>
				)
			)}
			{conversationsLoadingCompleted ? (
				<>
					<Divider color="gray2" />
					{totalConversations > 0 || loadMoreCallback ? (
						<CustomList
							onListBottom={loadMoreCallback}
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
					<DragImageContainer ref={dragImageRef}>
						<DragItems draggedIds={draggedIds ?? {}} deselectAll={deselectAll} />
					</DragImageContainer>
				</>
			) : (
				<ShimmerList count={totalConversations} delay={500} />
			)}
		</>
	);
});
