/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { memo } from 'react';

import { SearchMessageListItem } from './search-message-list-item';
import { useMessageById } from '../../../../store/emails/store';

type SearchMessageListItemWrapperProps = {
	messageId: string;
	selected: boolean;
	selecting: boolean;
	toggle: (id: string) => void;
	active?: boolean;
	deselectAll: () => void;
};
export const SearchMessageListItemWrapper = memo(function MessageListItem({
	messageId,
	selected,
	selecting,
	toggle,
	active,
	deselectAll
}: SearchMessageListItemWrapperProps): React.JSX.Element {
	const completeMessage = useMessageById(messageId);
	return (
		completeMessage && (
			<SearchMessageListItem
				completeMessage={completeMessage}
				key={messageId}
				selected={selected}
				selecting={selecting}
				toggle={toggle}
				active={active}
				deselectAll={deselectAll}
			/>
		)
	);
});
