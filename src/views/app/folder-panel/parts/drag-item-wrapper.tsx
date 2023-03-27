/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Drag } from '@zextras/carbonio-design-system';
import { useAppContext } from '@zextras/carbonio-shell-ui';
import React, { FC, useCallback } from 'react';
import { AppContext, DragItemWrapperProps, MsgListDraggableItemType } from '../../../../types';

export const DragItemWrapper: FC<DragItemWrapperProps> = ({
	item,
	selectedIds,
	selectedItems,
	setDraggedIds,
	dragImageRef,
	children,
	dragAndDropIsDisabled
}) => {
	const folderId = item.parent;
	const { isMessageView } = useAppContext<AppContext>();

	const dragCheck = useCallback(
		(e: React.DragEvent, id: string) => {
			if (dragImageRef?.current) {
				e.dataTransfer.setDragImage(dragImageRef.current, 0, 0);
			}
			if (selectedItems[id]) {
				setDraggedIds(selectedItems);
			} else {
				setDraggedIds({ [id]: true });
			}
		},
		[dragImageRef, selectedItems, setDraggedIds]
	);

	const DraggableItem: FC<MsgListDraggableItemType> = () =>
		isMessageView ? (
			<Drag
				type="message"
				data={{ ...item, parentFolderId: folderId, selectedIDs: selectedIds }}
				style={{ display: 'block' }}
				onDragStart={(e): void => dragCheck(e, item.id)}
			>
				{children}
			</Drag>
		) : (
			<>{children}</>
		);

	const ids = Object.keys(selectedItems ?? []);

	return dragAndDropIsDisabled ? (
		<>{children}</>
	) : (
		<Drag
			type="message"
			data={{ ...item, parentFolderId: folderId, selectedIDs: ids }}
			style={{ display: 'block' }}
			onDragStart={(e): void => dragCheck(e, item.id)}
			data-testid="MailItemContainer"
		>
			<DraggableItem
				item={item}
				folderId={folderId}
				isMessageView={isMessageView}
				dragCheck={dragCheck}
				selectedIds={ids}
			>
				{children}
			</DraggableItem>
		</Drag>
	);
};
