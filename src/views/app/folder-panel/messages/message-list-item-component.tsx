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
	toggle: (id: string) => void;
	isSelectModeOn: boolean;
	dragImageRef?: React.MutableRefObject<HTMLDivElement | null>;
	draggedIds?: Record<string, boolean>;
	isSearchModule?: boolean;
	visible: boolean;
	setDraggedIds?: (ids: Record<string, boolean>) => void;
	currentFolderId?: string;
};

export const MessageListItemComponent = memo(function MessageListItemComponent({
	messageId,
	deselectAll,
	selectedItems,
	isSelected,
	active,
	toggle,
	isSelectModeOn,
	dragImageRef,
	isSearchModule,
	visible,
	setDraggedIds = noop,
	currentFolderId
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
				toggle={toggle}
				active={active}
				visible={visible}
				isSearchModule={isSearchModule}
				currentFolderId={currentFolderId}
			/>
		</DragItemWrapper>
	);
});
