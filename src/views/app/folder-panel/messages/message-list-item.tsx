/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { memo, MouseEventHandler, useCallback, useMemo } from 'react';

import { Container } from '@zextras/carbonio-design-system';
import { useUserSettings } from '@zextras/carbonio-shell-ui';
import { debounce } from 'lodash';
import { useNavigate, useParams } from 'react-router-dom';

import { useShouldReplaceHistory } from '../../../../hooks/use-should-replace-history';
import { FolderPanelRouteParams } from '../../../../types/routes';
import { EditViewActions, MAILS_ROUTE } from 'constants/index';
import { useMsgPreviewOnSeparatedWindowFn } from 'hooks/actions/use-msg-preview-on-separated-window';
import { useMsgSetReadFn } from 'hooks/actions/use-msg-set-read';
import { useOnMouseHover } from 'hooks/use-on-mouse-hover';
import { MessageListItemProps } from 'types/index.d';
import { createEditBoard } from 'views/app/detail-panel/edit/edit-view-board';
import { MessageListItemActionWrapper } from 'views/app/folder-panel/messages/message-list-item-action-wrapper';
import { MessageListItemCore } from 'views/app/folder-panel/messages/message-list-item-core';

export const MessageListItem = memo(function MessageListItem({
	message,
	selected,
	selecting,
	isConvChildren,
	active,
	isSearchModule,
	handleReplaceHistory,
	index,
	onSelect
}: MessageListItemProps): React.JSX.Element {
	const { folderId } = useParams<FolderPanelRouteParams>();
	const navigate = useNavigate();
	const firstChildFolderId = folderId ?? message?.parent;
	const shouldReplaceHistory = useShouldReplaceHistory(message);
	const zimbraPrefMarkMsgRead = useUserSettings()?.prefs?.zimbraPrefMarkMsgRead !== '-1';

	const previewOnSeparatedWindow = useMsgPreviewOnSeparatedWindowFn({
		messageId: message.id,
		folderId: firstChildFolderId
	});

	const setAsRead = useMsgSetReadFn({
		ids: [message.id],
		shouldReplaceHistory,
		isMessageRead: message.read,
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
				if (!message.read && zimbraPrefMarkMsgRead) {
					setAsRead.canExecute() && setAsRead.execute();
				}
				if (handleReplaceHistory) {
					handleReplaceHistory();
				} else {
					debouncedPushHistory();
				}
			}
		},
		[message.read, zimbraPrefMarkMsgRead, handleReplaceHistory, setAsRead, debouncedPushHistory]
	);
	const onDoubleClickCallback = useCallback(
		(e: React.MouseEvent) => {
			if (!e.isDefaultPrevented()) {
				debouncedPushHistory();
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
				>
					<MessageListItemCore
						message={message}
						selected={selected}
						selecting={selecting}
						isConvChildren={isConvChildren}
						isSearchModule={isSearchModule}
						firstChildFolderId={firstChildFolderId}
						index={index}
						onSelect={onSelect}
					/>
				</MessageListItemActionWrapper>
			) : (
				<Container onClick={onClickCallback}>
					<MessageListItemCore
						message={message}
						selected={selected}
						selecting={selecting}
						isConvChildren={isConvChildren}
						isSearchModule={isSearchModule}
						firstChildFolderId={firstChildFolderId}
						index={index}
						onSelect={onSelect}
					/>
				</Container>
			)}
		</Container>
	);
});
