/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { memo } from 'react';

import { useMessageById } from 'store/emails/store';
import { SearchMessageListItem } from 'views/search/list/message/search-message-list-item';

type SearchMessageListItemWrapperProps = {
	messageId: string;
	selected: boolean;
	selecting: boolean;
	toggle: (id: string) => void;
	active?: boolean;
};
export const SearchMessageListItemWrapper = memo(function MessageListItem({
	messageId,
	selected,
	selecting,
	toggle,
	active
}: SearchMessageListItemWrapperProps): React.JSX.Element {
	const completeMessage = useMessageById(messageId);

	if (!completeMessage) {
		return <></>;
	}

	return (
		<SearchMessageListItem
			completeMessage={completeMessage}
			key={messageId}
			selected={selected}
			selecting={selecting}
			toggle={toggle}
			active={active}
		/>
	);
});
