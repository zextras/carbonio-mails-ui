/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { memo, MouseEventHandler, useCallback, useMemo } from 'react';

import { Container } from '@zextras/carbonio-design-system';
import { debounce } from 'lodash';
import { useNavigate, useParams } from 'react-router-dom';

import { MessageListItemActionWrapper } from './message-list-item-action-wrapper';
import { MessageListItemCore } from './message-list-item-core';
import { EditViewActions, MAILS_ROUTE } from '../../../../constants';
import { useMsgPreviewOnSeparatedWindowFn } from '../../../../hooks/actions/use-msg-preview-on-separated-window';
import { useOnMouseHover } from '../../../../hooks/use-on-mouse-hover';
import { MessageListItemProps } from '../../../../types';
import { createEditBoard } from '../../detail-panel/edit/edit-view-board';

type RouteParams = {
	folderId: string;
	itemId: string;
};

export const MessageListItem = memo(function MessageListItem({
	message,
	selected,
	selecting,
	toggle,
	isConvChildren,
	active,
	isSearchModule,
	deselectAll,
	handleReplaceHistory
}: MessageListItemProps): React.JSX.Element {
	const { folderId, itemId } = useParams<RouteParams>();
	const navigate = useNavigate();
	const firstChildFolderId = folderId ?? message?.parent;
	const shouldReplaceHistory = useMemo(() => itemId === message.id, [message.id, itemId]);

	const previewOnSeparatedWindow = useMsgPreviewOnSeparatedWindowFn({
		messageId: message.id,
		folderId: firstChildFolderId
	});

	const debouncedPushHistory = useMemo(
		() =>
			debounce(
				() =>
					navigate(`/${MAILS_ROUTE}/folder/${firstChildFolderId}/message/${message.id}`, {
						replace: true
					}),
				200,
				{
					leading: false,
					trailing: true
				}
			),
		[firstChildFolderId, message.id, navigate]
	);
	const onClickCallback = useCallback<MouseEventHandler<HTMLDivElement>>(
		(e) => {
			if (!e.isDefaultPrevented()) {
				if (handleReplaceHistory) {
					handleReplaceHistory();
				} else {
					debouncedPushHistory();
				}
			}
		},
		[handleReplaceHistory, debouncedPushHistory]
	);
	const onDoubleClickCallback = useCallback(
		(e: React.MouseEvent) => {
			if (!e.isDefaultPrevented()) {
				debouncedPushHistory.cancel();
				const { id, isDraft } = message;
				if (isDraft) {
					createEditBoard({
						action: EditViewActions.EDIT_AS_DRAFT,
						actionTargetId: id
					});
				} else {
					previewOnSeparatedWindow.canExecute() && previewOnSeparatedWindow.execute();
				}
			}
		},
		[debouncedPushHistory, previewOnSeparatedWindow, message]
	);

	const { ref, hasBeenHovered } = useOnMouseHover();

	return (
		<Container ref={ref} mainAlignment="flex-start" data-testid={`MessageListItem-${message.id}`}>
			{hasBeenHovered ? (
				<MessageListItemActionWrapper
					item={message}
					active={active}
					onClick={onClickCallback}
					onDoubleClick={onDoubleClickCallback}
					shouldReplaceHistory={shouldReplaceHistory}
					deselectAll={deselectAll}
				>
					<MessageListItemCore
						message={message}
						selected={selected}
						selecting={selecting}
						isConvChildren={isConvChildren}
						toggle={toggle}
						isSearchModule={isSearchModule}
						firstChildFolderId={firstChildFolderId}
					/>
				</MessageListItemActionWrapper>
			) : (
				<MessageListItemCore
					message={message}
					selected={selected}
					selecting={selecting}
					isConvChildren={isConvChildren}
					toggle={toggle}
					isSearchModule={isSearchModule}
					firstChildFolderId={firstChildFolderId}
				/>
			)}
		</Container>
	);
});
