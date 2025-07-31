/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { RefObject } from 'react';

import { useConversationById } from 'store/emails/store';
import { ConversationListItem } from 'views/app/folder-panel/conversations/conversation-list-item';
import { DragItemWrapper } from 'views/app/folder-panel/parts/drag-item-wrapper';

type ConversationListItemComponentProps = {
	conversationId: string;
	activeItemId?: string;
	selected: boolean;
	selecting: boolean;
	active?: boolean;
	setDraggedIds: (ids: Record<string, boolean>) => void;
	draggedIds?: Record<string, boolean>;
	selectedItems?: Record<string, boolean>;
	dragImageRef?: RefObject<HTMLInputElement>;
	isSearchModule?: boolean;
	selectedIds?: string[];
	deselectAll: () => void;
	folderId: string;
	visible?: boolean;
	index: number;
	onSelect: (index: number, id: string, event: React.MouseEvent) => void;
};

export const ConversationListItemComponent = ({
	activeItemId,
	conversationId,
	selected,
	selecting,
	active,
	setDraggedIds,
	selectedItems = {},
	dragImageRef,
	isSearchModule,
	selectedIds = [],
	deselectAll,
	folderId,
	index,
	onSelect
}: ConversationListItemComponentProps): React.JSX.Element => {
	const conversation = useConversationById(conversationId);
	return (
		conversation && (
			<DragItemWrapper
				item={conversation}
				selectedIds={selectedIds}
				selectedItems={selectedItems}
				setDraggedIds={setDraggedIds}
				dragImageRef={dragImageRef}
				dragAndDropIsDisabled={!!isSearchModule}
				deselectAll={deselectAll}
			>
				<ConversationListItem
					activeItemId={activeItemId}
					conversation={conversation}
					selected={selected}
					selecting={selecting}
					active={active}
					setDraggedIds={setDraggedIds}
					dragImageRef={dragImageRef}
					isSearchModule={isSearchModule}
					deselectAll={deselectAll}
					folderId={folderId}
					index={index}
					onSelect={onSelect}
				/>
			</DragItemWrapper>
		)
	);
};
