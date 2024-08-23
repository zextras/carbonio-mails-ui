/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC, memo, useMemo } from 'react';

import { Button, Container, ListV2 } from '@zextras/carbonio-design-system';
import { useAppContext } from '@zextras/carbonio-shell-ui';
import { map, noop } from 'lodash';

import { CustomListItem } from '../../../../carbonio-ui-commons/components/list/list-item';
import { API_REQUEST_STATUS } from '../../../../constants';
import { useSelection } from '../../../../hooks/use-selection';
import { AppContext, IncompleteMessage, SearchRequestStatus } from '../../../../types';
import { MessageListItem } from '../../../app/folder-panel/messages/message-list-item';

type SearchConversationMessagesListProps = {
	active: string;
	conversationStatus: SearchRequestStatus | undefined;
	messages: Array<IncompleteMessage>;
	length: number;
};

export const SearchConversationMessagesList: FC<SearchConversationMessagesListProps> = memo(
	function SearchConversationMessagesList({ active, conversationStatus, messages, length }) {
		const { setCount, count } = useAppContext<AppContext>();

		const { selected, toggle, deselectAll, isSelectModeOn } = useSelection({
			setCount,
			count,
			items: messages
		});

		const listItems = useMemo(
			() =>
				map(messages, (message) => {
					const isActive = active === message.id || active === message.conversation;
					const isSelected = selected[message.id];

					return (
						<CustomListItem
							selected={false}
							active={isActive}
							key={message.id}
							background={'transparent'}
						>
							{(visible: boolean): React.JSX.Element =>
								visible ? (
									<MessageListItem
										item={message}
										selected={isSelected}
										selecting={isSelectModeOn}
										visible={visible}
										toggle={toggle}
										active={isActive}
										isConvChildren
										deselectAll={deselectAll}
										currentFolderId={message.parent}
										isSearchModule
									/>
								) : (
									<div style={{ height: '4rem' }} />
								)
							}
						</CustomListItem>
					);
				}),
			[active, deselectAll, isSelectModeOn, messages, selected, toggle]
		);

		if (conversationStatus !== API_REQUEST_STATUS.fulfilled) {
			return (
				<Container height={64 * length}>
					<Button loading disabled label="" type="ghost" onClick={noop} />
				</Container>
			);
		}

		return <ListV2 style={{ paddingBottom: '0.25rem' }}>{listItems}</ListV2>;
	}
);
