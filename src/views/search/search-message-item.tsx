/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { ReactElement } from 'react';

import { CustomListItem } from '../../carbonio-ui-commons/components/list/list-item';
import { useMessagesStore } from '../../store/zustand/messages-store/store';
import type { IncompleteMessage } from '../../types';
import { MessageListItemComponent } from '../app/folder-panel/messages/message-list-item-component';

type SearchMessageItemProps = {
	message: IncompleteMessage;
	selected: Record<string, boolean>;
	isSelected: boolean;
	active: boolean;
	toggle: (id: string) => void;
	isSelectModeOn: boolean;
	deselectAll: () => void;
};
export const SearchMessageItem = ({
	message,
	isSelected,
	selected,
	active,
	toggle,
	isSelectModeOn,
	deselectAll
}: SearchMessageItemProps): React.JSX.Element => {
	const completeMessage = useMessagesStore.getState().messages[message.id];

	return (
		<CustomListItem
			key={completeMessage.id}
			selected={isSelected}
			active={active}
			background={completeMessage.read ? 'gray6' : 'gray5'}
		>
			{(visible: boolean): ReactElement =>
				visible ? (
					<MessageListItemComponent
						message={completeMessage}
						selected={selected}
						isSelected={isSelected}
						active={active}
						toggle={toggle}
						isSelectModeOn={isSelectModeOn}
						isSearchModule
						deselectAll={deselectAll}
						visible={visible}
					/>
				) : (
					<div style={{ height: '4rem' }} data-testid={`invisible-message-${completeMessage.id}`} />
				)
			}
		</CustomListItem>
	);
};
