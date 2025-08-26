/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { memo } from 'react';

import { noop } from 'lodash';

import { useMessageById } from 'store/emails/store';
import { MessageListItem } from 'views/app/folder-panel/messages/message-list-item';
import { DragItemWrapper } from 'views/app/folder-panel/parts/drag-item-wrapper';

export type ListItemComponentProps = {
	deselectAll: () => void;
	messageId: string;
	selectedItems: Record<string, boolean>;
	isSelected: boolean;
	active: boolean;
	isSelectModeOn: boolean;
	dragImageRef?: React.MutableRefObject<HTMLDivElement | null>;
	draggedIds?: Record<string, boolean>;
	isSearchModule?: boolean;
	visible: boolean;
	setDraggedIds?: (ids: Record<string, boolean>) => void;
	currentFolderId?: string;
	index: number;
	onSelect: (index: number, id: string, event: React.MouseEvent) => void;
};

export const MessageListItemComponent = memo(function MessageListItemComponent({
	messageId,
	deselectAll,
	selectedItems,
	isSelected,
	active,
	isSelectModeOn,
	dragImageRef,
	isSearchModule,
	visible,
	setDraggedIds = noop,
	currentFolderId,
	index,
	onSelect
}: ListItemComponentProps): React.JSX.Element {
	const message = useMessageById(messageId);
	if (!message) return <></>;
	return (
		<DragItemWrapper
			item={message}
			deselectAll={deselectAll}
			selectedIds={[]}
			selectedItems={selectedItems}
			setDraggedIds={setDraggedIds}
			dragImageRef={dragImageRef}
			dragAndDropIsDisabled={!!isSearchModule}
		>
			<MessageListItem
				message={message}
				selected={isSelected}
				selecting={isSelectModeOn}
				isConvChildren={false}
				active={active}
				visible={visible}
				isSearchModule={isSearchModule}
				currentFolderId={currentFolderId}
				index={index}
				onSelect={onSelect}
			/>
		</DragItemWrapper>
	);
});
