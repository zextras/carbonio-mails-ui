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
import type { AppContext, ConversationMessagesListProps } from '../../../../types';
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
		dragImageRef,
		setDraggedIds = noop
	}) {
		const { setCount, count } = useAppContext<AppContext>();

		const { selected, toggle, deselectAll, isSelectModeOn } = useSelection({
			currentFolderId: folderId,
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
							{(visible: boolean): JSX.Element =>
								visible ? (
									<DragItemWrapper
										item={message}
										selectedIds={[]}
										selectedItems={{}}
										setDraggedIds={setDraggedIds}
										dragImageRef={dragImageRef}
										dragAndDropIsDisabled={!!isSearchModule}
									>
										<MessageListItem
											item={message}
											selected={isSelected}
											selecting={isSelectModeOn}
											visible={visible}
											toggle={toggle}
											active={isActive}
											isConvChildren
											deselectAll={deselectAll}
											currentFolderId={folderId}
											isSearchModule={isSearchModule}
										/>
									</DragItemWrapper>
								) : (
									<div style={{ height: '4rem' }} />
								)
							}
						</CustomListItem>
					);
				}),
			[
				active,
				deselectAll,
				dragImageRef,
				folderId,
				isSearchModule,
				isSelectModeOn,
				messages,
				selected,
				setDraggedIds,
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
