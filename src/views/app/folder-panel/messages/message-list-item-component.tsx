/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, memo } from 'react';

import { noop } from 'lodash';

import { MessageListItem } from './message-list-item';
import { useMessageById } from '../../../../store/zustand/emails/store';
import { DragItemWrapper } from '../parts/drag-item-wrapper';

export type ListItemComponentProps = {
	messageId: string;
	selected: Record<string, boolean>;
	isSelected: boolean;
	active: boolean;
	toggle: (id: string) => void;
	isSelectModeOn: boolean;
	dragImageRef?: React.MutableRefObject<HTMLDivElement | null>;
	draggedIds?: Record<string, boolean>;
	isSearchModule?: boolean;
	deselectAll: () => void;
	visible: boolean;
	setDraggedIds?: (ids: Record<string, boolean>) => void;
	currentFolderId?: string;
};

export const MessageListItemComponent: FC<ListItemComponentProps> = memo(
	function MessageListItemComponent({
		messageId,
		selected,
		isSelected,
		active,
		toggle,
		isSelectModeOn,
		dragImageRef,
		isSearchModule,
		deselectAll,
		visible,
		setDraggedIds = noop,
		currentFolderId
	}) {
		const message = useMessageById(messageId);
		return (
			<DragItemWrapper
				item={message}
				selectedIds={[]}
				selectedItems={selected}
				setDraggedIds={setDraggedIds}
				dragImageRef={dragImageRef}
				dragAndDropIsDisabled={!!isSearchModule}
				deselectAll={deselectAll}
			>
				<MessageListItem
					item={message}
					selected={isSelected}
					selecting={isSelectModeOn}
					isConvChildren={false}
					toggle={toggle}
					active={active}
					visible={visible}
					isSearchModule={isSearchModule}
					deselectAll={deselectAll}
					currentFolderId={currentFolderId}
				/>
			</DragItemWrapper>
		);
	}
);
