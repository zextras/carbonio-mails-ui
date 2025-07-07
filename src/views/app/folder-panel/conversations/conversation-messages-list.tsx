/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { memo, useMemo } from 'react';

import { Button, Container, List } from '@zextras/carbonio-design-system';
import { useAppContext } from '@zextras/carbonio-shell-ui';
import { CustomListItem } from '@zextras/carbonio-ui-commons';
import { map, noop } from 'lodash';

import { API_REQUEST_STATUS } from 'constants/index';
import { useMultipleSelection } from 'hooks/use-selection';
import type { AppContext, IncompleteMessage, SearchRequestStatus } from 'types/index.d';
import { MessageListItem } from 'views/app/folder-panel/messages/message-list-item';
import { DragItemWrapper } from 'views/app/folder-panel/parts/drag-item-wrapper';

type ConversationMessagesListProps = {
	activeItemId?: string;
	conversationStatus: SearchRequestStatus | undefined;
	messages: Array<IncompleteMessage>;
	folderId: string;
	length: number;
	isSearchModule?: boolean;
	dragImageRef?: React.RefObject<HTMLDivElement>;
	setDraggedIds?: (ids: Record<string, boolean>) => void;
};

export const ConversationMessagesList = memo(function ConversationMessagesList({
	activeItemId,
	conversationStatus,
	messages,
	folderId,
	length,
	isSearchModule,
	dragImageRef,
	setDraggedIds = noop
}: ConversationMessagesListProps): React.JSX.Element {
	const { setCount, count } = useAppContext<AppContext>();

	const { selected, toggle, deselectAll, isSelectModeOn } = useMultipleSelection({
		setCount,
		count,
		items: messages.map((message) => message.id)
	});

	const listItems = useMemo(
		() =>
			map(messages, (message) => {
				const isActive = activeItemId === message.id || activeItemId === message.conversation;
				const isSelected = selected[message.id];

				return (
					<CustomListItem
						data-testid={`conversation-message-list-item-${message.id}`}
						selected={false}
						active={isActive}
						key={message.id}
						background={'transparent'}
					>
						{(visible: boolean): React.JSX.Element =>
							visible && message ? (
								<DragItemWrapper
									item={message}
									selectedIds={[]}
									selectedItems={{}}
									setDraggedIds={setDraggedIds}
									dragImageRef={dragImageRef}
									dragAndDropIsDisabled={!!isSearchModule}
									deselectAll={deselectAll}
								>
									<MessageListItem
										message={message}
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
			activeItemId,
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

	if (conversationStatus !== API_REQUEST_STATUS.fulfilled) {
		return (
			<Container height={64 * length}>
				<Button loading disabled label="" type="ghost" onClick={noop} />
			</Container>
		);
	}

	return <List style={{ paddingBottom: '0.25rem' }}>{listItems}</List>;
});
