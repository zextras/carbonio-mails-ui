/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { memo, useMemo } from 'react';

import { Button, Container, ListV2 } from '@zextras/carbonio-design-system';
import { useAppContext } from '@zextras/carbonio-shell-ui';
import { map, noop } from 'lodash';
import { useNavigate } from 'react-router-dom';

import { CustomListItem } from '@zextras/carbonio-ui-commons';
import { API_REQUEST_STATUS } from '../../../../constants';
import { useSelection } from '../../../../hooks/use-selection';
import { AppContext, IncompleteMessage, SearchRequestStatus } from '../../../../types';
import { MessageListItem } from '../../../app/folder-panel/messages/message-list-item';

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
	const { setCount, count } = useAppContext<AppContext>();
	const navigate = useNavigate();

	const { selected, toggle, deselectAll, isSelectModeOn } = useSelection({
		setCount,
		count,
		items: messages.map((message) => message.id)
	});

	const listItems = useMemo(
		() =>
			map(messages, (message) => {
				const isActive = activeItemId === message.id || activeItemId === message.conversation;
				const isSelected = selected[message.id];
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
									toggle={toggle}
									active={isActive}
									isConvChildren
									deselectAll={deselectAll}
									currentFolderId={message.parent}
									handleReplaceHistory={handleSearchReplaceHistory}
									isSearchModule
								/>
							) : (
								<div style={{ height: '4rem' }} />
							)
						}
					</CustomListItem>
				);
			}),
		[activeItemId, deselectAll, isSelectModeOn, messages, navigate, selected, toggle]
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
