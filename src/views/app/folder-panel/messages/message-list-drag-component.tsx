/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { map, noop } from 'lodash';

import { MessageListItem } from './message-list-item';
import { getMessageById } from '../../../../store/emails/store';

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
			{map(items, (item) => (
				<MessageListItem
					message={item}
					key={`dragged-item-${item.id}`}
					isConvChildren={false}
					toggle={noop}
					selected={false}
					selecting={false}
					visible={false}
					deselectAll={noop}
				/>
			))}
		</>
	);
};
