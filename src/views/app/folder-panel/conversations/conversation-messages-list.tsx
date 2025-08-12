/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { memo, useCallback, useMemo, useState } from 'react';

import { Button, Container, List } from '@zextras/carbonio-design-system';
import { CustomListItem } from '@zextras/carbonio-ui-commons';
import { map, noop } from 'lodash';

import { API_REQUEST_STATUS } from 'constants/index';
import { useMultipleSelection } from 'hooks/use-multiple-selection';
import type { IncompleteMessage, SearchRequestStatus } from 'types/index.d';
import { MessageListItem } from 'views/app/folder-panel/messages/message-list-item';
import { DragItemWrapper } from 'views/app/folder-panel/parts/drag-item-wrapper';

type ConversationMessagesListProps = {
	activeItemId?: string;
	conversationStatus: SearchRequestStatus | undefined;
	messages: Array<IncompleteMessage>;
	folderId: string;
	length: number;
	isSearchModule?: boolean;
	dragImageRef?: React.RefObject<HTMLDivElement>;
	setDraggedIds?: (ids: Record<string, boolean>) => void;
};

export const ConversationMessagesList = memo(function ConversationMessagesList({
	activeItemId,
	conversationStatus,
	messages,
	folderId,
	length,
	isSearchModule,
	dragImageRef,
	setDraggedIds = noop
}: ConversationMessagesListProps): React.JSX.Element {
	const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);
	const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
	const {
		toggleItemSelection: toggle,
		isSelectModeOn,
		selectRange
	} = useMultipleSelection({
		allAvailableItems: messages.map((message) => message.id),
		selectedItems,
		setSelectedItems
	});

	const handleItemClick = useCallback(
		(index: number, id: string, event: React.MouseEvent) => {
			if (!isSelectModeOn) {
				// First click: turn on selection mode and select the item
				toggle(id);
				setLastSelectedIndex(index);
				return;
			}

			// Selection mode is on
			if (event.shiftKey && lastSelectedIndex !== null) {
				const start = Math.min(lastSelectedIndex, index);
				const end = Math.max(lastSelectedIndex, index);
				const idsToSelect = messages.map((message) => message.id).slice(start, end + 1);
				selectRange(idsToSelect);
			} else {
				toggle(id);
				setLastSelectedIndex(index);
			}
		},
		[isSelectModeOn, lastSelectedIndex, toggle, messages, selectRange]
	);

	const listItems = useMemo(
		() =>
			map(messages, (message, index) => {
				const isActive = activeItemId === message.id || activeItemId === message.conversation;
				const isSelected = selectedItems.has(message.id);

				return (
					<CustomListItem
						data-testid={`conversation-message-list-item-${message.id}`}
						selected={false}
						active={isActive}
						key={message.id}
						background={'transparent'}
					>
						{(visible: boolean): React.JSX.Element =>
							visible && message ? (
								<DragItemWrapper
									deselectAll={noop}
									item={message}
									selectedIds={[]}
									selectedItems={{}}
									setDraggedIds={setDraggedIds}
									dragImageRef={dragImageRef}
									dragAndDropIsDisabled={!!isSearchModule}
								>
									<MessageListItem
										message={message}
										selected={isSelected}
										selecting={isSelectModeOn}
										visible={visible}
										active={isActive}
										isConvChildren
										currentFolderId={folderId}
										isSearchModule={isSearchModule}
										index={index}
										onSelect={handleItemClick}
									/>
								</DragItemWrapper>
							) : (
								<div style={{ height: '4rem' }} />
							)
						}
					</CustomListItem>
				);
			}),
		[
			activeItemId,
			dragImageRef,
			folderId,
			handleItemClick,
			isSearchModule,
			isSelectModeOn,
			messages,
			selectedItems,
			setDraggedIds
		]
	);

	if (conversationStatus !== API_REQUEST_STATUS.fulfilled) {
		return (
			<Container height={64 * length}>
				<Button loading disabled label="" type="ghost" onClick={noop} />
			</Container>
		);
	}

	return <List style={{ paddingBottom: '0.25rem' }}>{listItems}</List>;
});
