/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { SearchConversationListItem } from './search-conversation-list-item';
import { CustomListItem } from '../../../../carbonio-ui-commons/components/list/list-item';
import { useConversationById } from '../../../../store/zustand/message-store/store';

type SearchConversationItemProps = {
	conversationId: string;
	itemId: string;
	isSelected: boolean;
	active: boolean;
	toggle: (id: string) => void;
	isSelectModeOn: boolean;
	deselectAll: () => void;
};
export const SearchConversationItem = ({
	conversationId,
	itemId,
	isSelected,
	active,
	toggle,
	isSelectModeOn,
	deselectAll
}: SearchConversationItemProps): React.JSX.Element => {
	const conversation = useConversationById(conversationId);
	// TODO: find out the visibility thing, using invisible component does not show items
	return (
		<CustomListItem
			active={active}
			selected={isSelected}
			key={conversationId}
			background={'transparent'}
		>
			{(visible: boolean): React.JSX.Element => (
				<SearchConversationListItem
					activeItemId={itemId}
					item={conversation}
					selected={isSelected}
					selecting={isSelectModeOn}
					toggle={toggle}
					active={active}
					isSearchModule
					isConvChildren
					deselectAll={deselectAll}
					folderId={''}
				/>
			)}
		</CustomListItem>
	);
};
