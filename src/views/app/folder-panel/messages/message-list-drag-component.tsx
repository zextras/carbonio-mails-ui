/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { map, noop } from 'lodash';

import { getMessageById } from 'store/emails/store';
import { MessageListItem } from 'views/app/folder-panel/messages/message-list-item';

export const DragItems = ({
	draggedIds
}: {
	draggedIds: Record<string, boolean>;
}): React.JSX.Element => {
	const items = map(Object.keys(draggedIds), (draggedItemId) =>
		getMessageById(draggedItemId)
	).filter(Boolean);
	return (
		<>
			{map(items, (item, index) => (
				<MessageListItem
					message={item}
					key={`dragged-item-${item.id}`}
					isConvChildren={false}
					selected={false}
					selecting={false}
					visible={false}
					index={index}
					onSelect={noop}
				/>
			))}
		</>
	);
};
