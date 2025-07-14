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
	toggleMultipleSelection: (id: string) => void;
	active?: boolean;
	setDraggedIds: (ids: Record<string, boolean>) => void;
	draggedIds?: Record<string, boolean>;
	selectedItems?: Set<string>;
	dragImageRef?: RefObject<HTMLInputElement>;
	isSearchModule?: boolean;
	selectedIds?: string[];
	deselectAll: () => void;
	folderId: string;
	visible?: boolean;
};

export const ConversationListItemComponent = ({
	activeItemId,
	conversationId,
	selected,
	selecting,
	toggleMultipleSelection,
	active,
	setDraggedIds,
	selectedItems = new Set(),
	dragImageRef,
	isSearchModule,
	selectedIds = [],
	deselectAll,
	folderId
}: ConversationListItemComponentProps): React.JSX.Element => {
	const conversation = useConversationById(conversationId);
	const selectedDragItems: Record<string, boolean> = Object.fromEntries(
		Array.from(selectedItems, (item) => [item, true])
	);

	return (
		conversation && (
			<DragItemWrapper
				item={conversation}
				selectedIds={selectedIds}
				selectedItems={selectedDragItems}
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
					toggleMultipleSelection={toggleMultipleSelection}
					active={active}
					setDraggedIds={setDraggedIds}
					dragImageRef={dragImageRef}
					isSearchModule={isSearchModule}
					deselectAll={deselectAll}
					folderId={folderId}
				/>
			</DragItemWrapper>
		)
	);
};
