/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { noop } from 'lodash';
import React, { FC, memo } from 'react';
import { CustomListItem } from '../../../../carbonio-ui-commons/components/list/list-item';
import { IncompleteMessage } from '../../../../types';
import { DragItemWrapper } from '../parts/drag-item-wrapper';
import { MessageListItem } from './message-list-item';

type ListItemComponentProps = {
	message: IncompleteMessage;
	selected: Record<string, boolean>;
	isSelected: boolean;
	isActive: boolean;
	toggle: (id: string) => void;
	isSelectModeOn: boolean;
	dragImageRef?: React.MutableRefObject<HTMLDivElement | null>;
	draggedIds?: Record<string, boolean>;
	isSearchModule?: boolean;
	deselectAll: () => void;
};

export const MessageListItemComponent: FC<ListItemComponentProps> = memo(
	function MessageListItemComponent({
		message,
		selected,
		isSelected,
		isActive,
		toggle,
		isSelectModeOn,
		dragImageRef,
		isSearchModule,
		deselectAll
	}) {
		return (
			<CustomListItem
				key={message.id}
				selected={isSelected}
				active={isActive}
				background={message.read ? 'gray6' : 'gray5'}
			>
				{(isVisible: boolean): JSX.Element => (
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
							active={isActive}
							visible={isVisible}
							isSearchModule={isSearchModule}
							deselectAll={deselectAll}
						/>
					</DragItemWrapper>
				)}
			</CustomListItem>
		);
	}
);
