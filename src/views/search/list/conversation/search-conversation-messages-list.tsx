/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { memo, useMemo } from 'react';

import { Button, Container, ListV2 } from '@zextras/carbonio-design-system';
import { CustomListItem } from '@zextras/carbonio-ui-commons';
import { map, noop } from 'lodash';
import { useNavigate } from 'react-router-dom';

import { API_REQUEST_STATUS } from 'constants/index';
import { useMultipleSelection } from 'hooks/use-multiple-selection';
import { IncompleteMessage } from 'types/messages';
import { SearchRequestStatus } from 'types/search';
import { MessageListItem } from 'views/app/folder-panel/messages/message-list-item';

type SearchConversationMessagesListProps = {
	activeItemId?: string;
	conversationStatus: SearchRequestStatus | undefined;
	messages: Array<IncompleteMessage>;
	length: number;
};

export const SearchConversationMessagesList = memo(function SearchConversationMessagesList({
	activeItemId,
	conversationStatus,
	messages,
	length
}: SearchConversationMessagesListProps): React.JSX.Element {
	const navigate = useNavigate();

	const [selectedItems, setSelectedItems] = React.useState<Set<string>>(new Set());

	const { isSelectModeOn } = useMultipleSelection({
		allAvailableItems: messages.map((message) => message.id),
		selectedItems,
		setSelectedItems
	});

	const listItems = useMemo(
		() =>
			map(messages, (message, index) => {
				const isActive = activeItemId === message.id || activeItemId === message.conversation;
				const isSelected = selectedItems.has(message.id);
				const handleSearchReplaceHistory = (): void => {
					navigate(`../message/${message.id}`, { replace: true });
				};

				return (
					<CustomListItem
						selected={false}
						active={isActive}
						key={message.id}
						background={'transparent'}
					>
						{(visible: boolean): React.JSX.Element =>
							visible && message ? (
								<MessageListItem
									message={message}
									selected={isSelected}
									selecting={isSelectModeOn}
									visible={visible}
									active={isActive}
									isConvChildren
									currentFolderId={message.parent}
									handleReplaceHistory={handleSearchReplaceHistory}
									isSearchModule
									index={index}
									onSelect={noop}
								/>
							) : (
								<div style={{ height: '4rem' }} />
							)
						}
					</CustomListItem>
				);
			}),
		[activeItemId, isSelectModeOn, messages, navigate, selectedItems]
	);

	if (conversationStatus !== API_REQUEST_STATUS.fulfilled) {
		return (
			<Container height={64 * length}>
				<Button loading disabled label="" type="ghost" onClick={noop} />
			</Container>
		);
	}

	return <ListV2 style={{ paddingBottom: '0.25rem' }}>{listItems}</ListV2>;
});
