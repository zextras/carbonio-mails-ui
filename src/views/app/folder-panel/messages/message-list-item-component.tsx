/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { noop } from 'lodash';
import React, { FC, memo } from 'react';
import type { IncompleteMessage } from '../../../../types';
import { DragItemWrapper } from '../parts/drag-item-wrapper';
import { MessageListItem } from './message-list-item';

export type ListItemComponentProps = {
	message: IncompleteMessage;
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
};

export const MessageListItemComponent: FC<ListItemComponentProps> = memo(
	function MessageListItemComponent({
		message,
		selected,
		isSelected,
		active,
		toggle,
		isSelectModeOn,
		dragImageRef,
		isSearchModule,
		deselectAll,
		visible
	}) {
		return (
			<DragItemWrapper
				item={message}
				selectedIds={[]}
				selectedItems={selected}
				setDraggedIds={noop}
				dragImageRef={dragImageRef}
				dragAndDropIsDisabled={!!isSearchModule}
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
				/>
			</DragItemWrapper>
		);
	}
);
