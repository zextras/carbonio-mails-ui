/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { ReactElement } from 'react';

import { SearchMessageListItem } from './search-message-list-item';
import { CustomListItem } from '../../../../carbonio-ui-commons/components/list/list-item';
import { useMessageById } from '../../../../store/zustand/message-store/store';

type SearchMessageItemProps = {
	messageId: string;
	selected: Record<string, boolean>;
	isSelected: boolean;
	active: boolean;
	toggle: (id: string) => void;
	isSelectModeOn: boolean;
	deselectAll: () => void;
};
export const SearchMessageItem = ({
	messageId,
	isSelected,
	active,
	toggle,
	isSelectModeOn,
	deselectAll
}: SearchMessageItemProps): React.JSX.Element => {
	const completeMessage = useMessageById(messageId);
	return (
		<CustomListItem
			key={completeMessage.id}
			selected={isSelected}
			active={active}
			background={completeMessage.read ? 'gray6' : 'gray5'}
		>
			{(visible: boolean): ReactElement =>
				visible ? (
					<SearchMessageListItem
						itemId={completeMessage.id}
						selected={isSelected} // rename it
						selecting={isSelectModeOn} // rename it
						isConvChildren={false}
						toggle={toggle}
						active={active}
						visible={visible}
						isSearchModule
						deselectAll={deselectAll}
					/>
				) : (
					<div style={{ height: '4rem' }} data-testid={`invisible-message-${completeMessage.id}`} />
				)
			}
		</CustomListItem>
	);
};
