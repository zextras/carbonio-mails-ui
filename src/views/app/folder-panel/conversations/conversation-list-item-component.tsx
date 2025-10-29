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
	selectedItems: Record<string, boolean>;
	dragImageRef?: RefObject<HTMLInputElement>;
	deselectAll: () => void;
	isSearchModule?: boolean;
	selectedIds?: string[];
	folderId: string;
	visible?: boolean;
	index: number;
	onSelect: (index: number, id: string, event: React.MouseEvent) => void;
	onToggleExpanded?: (conversationId: string) => void;
	isConversationExpanded: boolean;
};

export const ConversationListItemComponent = ({
	activeItemId,
	conversationId,
	selected,
	selecting,
	active,
	setDraggedIds,
	selectedItems,
	dragImageRef,
	deselectAll,
	isSearchModule,
	selectedIds = [],
	folderId,
	index,
	onSelect,
	onToggleExpanded,
	isConversationExpanded
}: ConversationListItemComponentProps): React.JSX.Element => {
	const conversation = useConversationById(conversationId);

	return (
		conversation && (
			<DragItemWrapper
				item={conversation}
				selectedIds={selectedIds}
				selectedItems={selectedItems}
				setDraggedIds={setDraggedIds}
				deselectAll={deselectAll}
				dragImageRef={dragImageRef}
				dragAndDropIsDisabled={!!isSearchModule}
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
					folderId={folderId}
					index={index}
					onSelect={onSelect}
					onToggleExpanded={onToggleExpanded}
					isConversationExpanded={isConversationExpanded}
				/>
			</DragItemWrapper>
		)
	);
};
