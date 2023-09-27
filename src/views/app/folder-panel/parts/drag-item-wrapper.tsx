/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC } from 'react';

import { Drag } from '@zextras/carbonio-design-system';
import { useAppContext } from '@zextras/carbonio-shell-ui';

import type { AppContext, DragItemWrapperProps, MsgListDraggableItemType } from '../../../../types';

type DragCheckProps = {
	e: React.DragEvent;
	id: string;
	dragImageRef?: React.RefObject<HTMLElement>;
	selectedItems: Record<string, boolean>;
	setDraggedIds: (ids: Record<string, boolean>) => void;
};

const dragCheck = ({ e, id, dragImageRef, selectedItems, setDraggedIds }: DragCheckProps): void => {
	if (dragImageRef && dragImageRef?.current) {
		e.dataTransfer.setDragImage(dragImageRef.current, 0, 0);
	}
	if (selectedItems && selectedItems[id]) {
		setDraggedIds && setDraggedIds(selectedItems);
	} else {
		setDraggedIds && setDraggedIds({ [id]: true });
	}
};

type DraggableItemProps = {
	dragImageRef?: React.RefObject<HTMLElement>;
	selectedItems: Record<string, boolean>;
	setDraggedIds: (ids: Record<string, boolean>) => void;
	item: MsgListDraggableItemType['item'];
	folderId: string;
	isMessageView: boolean;
	selectedIds: string[];
};
const DraggableItem: FC<DraggableItemProps> = ({
	item,
	folderId,
	isMessageView,
	selectedIds,
	selectedItems,
	setDraggedIds,
	children
}) =>
	isMessageView ? (
		<Drag
			type="message"
			data={{ ...item, parentFolderId: folderId, selectedIDs: selectedIds }}
			style={{ display: 'block' }}
			onDragStart={(e): void => dragCheck({ e, id: item.id, selectedItems, setDraggedIds })}
		>
			{children}
		</Drag>
	) : (
		<>{children}</>
	);

export const DragItemWrapper: FC<DragItemWrapperProps> = ({
	item,
	selectedItems,
	setDraggedIds,
	dragImageRef,
	children,
	dragAndDropIsDisabled,
	deselectAll
}) => {
	const folderId = item.parent;
	const { isMessageView } = useAppContext<AppContext>();

	const ids = Object.keys(selectedItems ?? []);

	return dragAndDropIsDisabled ? (
		<>{children}</>
	) : (
		<Drag
			type="message"
			data={{ ...item, parentFolderId: folderId, selectedIDs: ids, deselectAll }}
			style={{ display: 'block' }}
			onDragStart={(e): void =>
				dragCheck({ e, id: item.id, selectedItems, setDraggedIds, dragImageRef })
			}
			data-testid="MailItemContainer"
		>
			<DraggableItem
				item={item}
				folderId={folderId}
				isMessageView={isMessageView}
				selectedIds={ids}
				selectedItems={selectedItems}
				setDraggedIds={setDraggedIds}
			>
				{children}
			</DraggableItem>
		</Drag>
	);
};
