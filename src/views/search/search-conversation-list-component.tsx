/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC, RefObject, memo, useEffect, useMemo } from 'react';

import { Container, Divider, Padding, Text } from '@zextras/carbonio-design-system';
import { find, map, noop, reduce } from 'lodash';
import styled from 'styled-components';

import { SearchConversationListItemComponent } from './search-conversation-list-item-component';
import ShimmerList from './shimmer-list';
import { CustomList } from '../../carbonio-ui-commons/components/list/list';
import { useFolder, useRoot } from '../../carbonio-ui-commons/store/zustand/folder/hooks';
import { NormalizedConversation } from '../../types';
import { MultipleSelectionActionsPanel } from '../../ui-actions/multiple-selection-actions-panel';
import { Breadcrumbs } from '../app/folder-panel/parts/breadcrumbs';
import { getFolderPath } from '../app/folder-panel/parts/utils/utils';

const DragImageContainer = styled.div`
	position: absolute;
	top: -312.5rem;
	left: -312.5rem;
	transform: translate(-100%, -100%);
	width: 35vw;
`;

const DragItems: FC<{
	conversations: Array<NormalizedConversation>;
	draggedIds: Record<string, boolean> | undefined;
}> = ({ conversations, draggedIds }) => {
	const items = reduce(
		draggedIds,
		(acc: Array<NormalizedConversation>, v, k) => {
			const obj = find(conversations, ['id', k]);
			if (obj) {
				return [...acc, obj];
			}
			return acc;
		},
		[]
	);

	return (
		<>
			{map(items, (item) => (
				<SearchConversationListItemComponent
					item={item}
					key={item.id}
					draggedIds={draggedIds}
					activeItemId={item.id}
					selected={false}
					selecting={false}
					toggle={noop}
					selectedIds={[]}
					deselectAll={noop}
					folderId=""
					setDraggedIds={noop}
				/>
			))}
		</>
	);
};

export type SearchConversationListComponentProps = {
	// the text to display in the side panel
	displayerTitle: string | null;
	// the list of conversations to display
	listItems: React.JSX.Element[];
	// the function to call when the list is scrolled to the bottom
	loadMore?: () => void;
	// the total number of conversations in the list
	totalConversations: number;
	// true if the call has been fulfilled
	conversationsLoadingCompleted: boolean;
	// the ids of the selected conversations
	selectedIds: string[];
	// the id of the current folder
	folderId: string;
	// the conversations to display
	conversations: Array<NormalizedConversation>;
	// the ids of the conversations being dragged
	draggedIds?: Record<string, boolean>;
	// the function to call when the user starts dragging a conversation
	setDraggedIds?: (ids: Record<string, boolean>) => void;
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
	hasMore?: boolean;
};

export const SearchConversationListComponent: FC<SearchConversationListComponentProps> = memo(
	function ConversationListComponent({
		displayerTitle,
		isSearchModule,
		isSelectModeOn,
		folderId,
		conversations,
		selected,
		deselectAll,
		selectAll,
		isAllSelected,
		selectAllModeOff,
		setIsSelectModeOn,
		conversationsLoadingCompleted,
		draggedIds,
		setDraggedIds,
		loadMore = noop,
		listItems,
		totalConversations,
		dragImageRef,
		listRef,
		hasMore
	}) {
		useEffect(() => {
			setDraggedIds && setDraggedIds(selected);
		}, [selected, setDraggedIds]);

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
						items={conversations}
						folderId={folderId}
						selectedIds={selectedIds}
						deselectAll={deselectAll}
						selectAll={selectAll}
						isAllSelected={isAllSelected}
						selectAllModeOff={selectAllModeOff}
						setIsSelectModeOn={setIsSelectModeOn}
					/>
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
						{totalConversations > 0 || hasMore ? (
							<CustomList
								onListBottom={(): void => {
									loadMore && loadMore();
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
						<DragImageContainer ref={dragImageRef}>
							<DragItems conversations={conversations} draggedIds={draggedIds} />
						</DragImageContainer>
					</>
				) : (
					<ShimmerList count={totalConversations} delay={500} />
				)}
			</>
		);
	}
);
