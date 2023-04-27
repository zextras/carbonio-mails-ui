/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { noop } from 'lodash';
import React, { FC } from 'react';

import type { Conversation } from '../../../../types';
import { DragItemWrapper } from '../parts/drag-item-wrapper';
import { ConversationListItem } from './conversation-list-item';

type ConversationListItemComponentProps = {
	item: Conversation;
	activeItemId: string;
	selected: boolean;
	selecting: boolean;
	toggle: (id: string) => void;
	active?: boolean;
	setDraggedIds?: (ids: Record<string, boolean>) => void;
	draggedIds?: Record<string, boolean> | undefined;
	selectedItems?: Record<string, boolean>;
	dragImageRef?: React.RefObject<HTMLInputElement>;
	isSearchModule?: boolean;
	selectedIds?: string[];
	deselectAll: () => void;
	folderId: string;
	visible?: boolean;
};

export const ConversationListItemComponent: FC<ConversationListItemComponentProps> = ({
	activeItemId,
	item,
	selected,
	selecting,
	toggle,
	active,
	setDraggedIds,
	draggedIds,
	selectedItems = {},
	dragImageRef,
	isSearchModule,
	selectedIds = [],
	deselectAll,
	folderId,
	visible
}) => (
	<DragItemWrapper
		item={item}
		selectedIds={selectedIds}
		selectedItems={selectedItems}
		setDraggedIds={noop}
		dragImageRef={dragImageRef}
		dragAndDropIsDisabled={!!isSearchModule}
	>
		<ConversationListItem
			activeItemId={activeItemId}
			item={item}
			selected={selected}
			selecting={selecting}
			toggle={toggle}
			active={active}
			setDraggedIds={setDraggedIds}
			draggedIds={draggedIds}
			selectedItems={selectedItems}
			dragImageRef={dragImageRef}
			isSearchModule
			isConvChildren
			deselectAll={deselectAll}
			folderId={folderId}
			visible={visible}
		/>
	</DragItemWrapper>
);
