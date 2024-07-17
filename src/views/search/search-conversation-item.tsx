/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { noop } from 'lodash';

import { SearchConversationListItemComponent } from './search-conversation-list-item-component';
import { CustomListItem } from '../../carbonio-ui-commons/components/list/list-item';
import { useMessageStore } from '../../store/zustand/message-store/store';

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
	const conversation = useMessageStore(
		(state) => state.populatedItems.conversations[conversationId]
	);
	// TODO:  should we use an invisible item like in search-message-item ?
	return (
		<CustomListItem
			active={active}
			selected={isSelected}
			key={conversationId}
			background={'transparent'}
		>
			{(visible: boolean): React.JSX.Element => (
				<SearchConversationListItemComponent
					item={conversation}
					selected={isSelected}
					selecting={isSelectModeOn}
					active={active}
					toggle={toggle}
					activeItemId={itemId}
					isSearchModule
					deselectAll={deselectAll}
					folderId=""
					visible={visible}
					setDraggedIds={noop}
				/>
			)}
		</CustomListItem>
	);
};
