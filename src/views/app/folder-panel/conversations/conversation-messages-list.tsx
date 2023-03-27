/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Button, Container, ListV2 } from '@zextras/carbonio-design-system';
import { useAppContext } from '@zextras/carbonio-shell-ui';
import { map, noop } from 'lodash';
import React, { FC, memo, useMemo } from 'react';
import { CustomListItem } from '../../../../carbonio-ui-commons/components/list/list-item';
import { useSelection } from '../../../../hooks/use-selection';
import { AppContext, ConversationMessagesListProps, MessageListItemProps } from '../../../../types';
import { MessageListItem } from '../messages/message-list-item';
import { DragItemWrapper } from '../parts/drag-item-wrapper';

export const ConversationMessagesList: FC<ConversationMessagesListProps> = memo(
	function ConversationMessagesList({
		active,
		conversationStatus,
		messages,
		folderId,
		length,
		isSearchModule,
		dragImageRef
	}) {
		const { setCount, count } = useAppContext<AppContext>();

		const { selected, toggle, deselectAll, isSelectModeOn } = useSelection({
			currentFolderId: folderId,
			setCount,
			count,
			items: messages
		});

		const messagesToRender = useMemo<MessageListItemProps['item'][]>(
			() =>
				map(messages, (item) => ({
					...item,
					id: item.id ?? '',
					isSearchModule
				})),
			[isSearchModule, messages]
		);

		const listItems = useMemo(
			() =>
				map(messagesToRender, (message) => {
					const isActive = active === message.id || active === message.conversation;
					const isSelected = selected[message.id];

					return (
						<CustomListItem
							selected={false}
							active={isActive}
							key={message.id}
							background={'transparent'}
						>
							{(isVisible: boolean): JSX.Element => (
								<DragItemWrapper
									item={message}
									selectedIds={[]}
									selectedItems={{}}
									setDraggedIds={noop}
									dragImageRef={dragImageRef}
									dragAndDropIsDisabled={!!isSearchModule}
								>
									<MessageListItem
										item={message}
										selected={isSelected}
										selecting={isSelectModeOn}
										visible={isVisible}
										toggle={toggle}
										active={isActive}
										isConvChildren
										deselectAll={deselectAll}
									/>
								</DragItemWrapper>
							)}
						</CustomListItem>
					);
				}),
			[
				active,
				deselectAll,
				dragImageRef,
				isSearchModule,
				isSelectModeOn,
				messagesToRender,
				selected,
				toggle
			]
		);

		if (conversationStatus !== 'complete') {
			return (
				<Container height={64 * length}>
					<Button loading disabled label="" type="ghost" onClick={noop} />
				</Container>
			);
		}

		return <ListV2 style={{ paddingBottom: '0.25rem' }}>{listItems}</ListV2>;
	}
);
