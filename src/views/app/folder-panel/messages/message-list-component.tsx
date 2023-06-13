/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { Container, Padding, Text } from '@zextras/carbonio-design-system';
import { find, map, noop, reduce } from 'lodash';
import React, { FC, memo, useCallback, useEffect, useMemo, useRef } from 'react';
import styled from 'styled-components';
import { CustomList } from '../../../../carbonio-ui-commons/components/list/list';
import { useFolder } from '../../../../carbonio-ui-commons/store/zustand/folder/hooks';
import type { IncompleteMessage, MailMessage, MessageListItemProps } from '../../../../types';
import { MultipleSelectionActionsPanel } from '../../../../ui-actions/multiple-selection-actions-panel';
import ShimmerList from '../../../search/shimmer-list';
import { Breadcrumbs } from '../parts/breadcrumbs';
import { MessageListItem } from './message-list-item';

const DragImageContainer = styled.div`
	position: absolute;
	top: -312.5rem;
	left: -312.5rem;
	transform: translate(-100%, -100%);
	width: 35vw;
`;

const DragItems: FC<{
	messages: IncompleteMessage[];
	draggedIds: Record<string, boolean>;
}> = ({ messages, draggedIds }) => {
	const items = reduce<typeof draggedIds, MessageListItemProps['item'][]>(
		draggedIds,
		(acc, v, k) => {
			const obj = find(messages, ['id', k]);
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
				<MessageListItem
					item={item}
					key={item.id}
					isConvChildren={false}
					toggle={noop}
					selected={false}
					selecting={false}
					visible={false}
					deselectAll={noop}
				/>
			))}
		</>
	);
};

export type MessageListComponentProps = {
	// the text to display in the side panel
	displayerTitle: string | null;
	// the list of messages to display
	listItems: JSX.Element[];
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
	messages: MailMessage[];
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
};

export const MessageListComponent: FC<MessageListComponentProps> = memo(
	function MessageListComponent({
		displayerTitle,
		listItems,
		loadMore,
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
		listRef
	}) {
		useEffect(() => {
			setDraggedIds && setDraggedIds(selected);
		}, [selected, setDraggedIds]);

		const folder = useFolder(folderId?.toString());
		const showBreadcrumbs = useMemo(
			() =>
				!isSearchModule ||
				typeof isSearchModule === undefined ||
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
						/>
					)
				)}
				{messagesLoadingCompleted ? (
					<>
						{totalMessages > 0 ? (
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
						<DragImageContainer ref={dragImageRef}>
							<DragItems messages={messages} draggedIds={draggedIds ?? {}} />
						</DragImageContainer>
					</>
				) : (
					<ShimmerList count={totalMessages} />
				)}
			</>
		);
	}
);
