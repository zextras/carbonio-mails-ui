/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, memo, MouseEventHandler, useCallback, useMemo } from 'react';

import { Container } from '@zextras/carbonio-design-system';
import { useUserSettings } from '@zextras/carbonio-shell-ui';
import { useNavigate, useParams } from 'react-router-dom';

import { EditViewActions } from 'constants/index';
import { useMsgPreviewOnSeparatedWindowFn } from 'hooks/actions/use-msg-preview-on-separated-window';
import { useMsgSetReadFn } from 'hooks/actions/use-msg-set-read';
import { useOnMouseHover } from 'hooks/use-on-mouse-hover';
import { MailMessage } from 'types/index.d';
import { createEditBoard } from 'views/app/detail-panel/edit/edit-view-board';
import { MessageListItemActionWrapper } from 'views/app/folder-panel/messages/message-list-item-action-wrapper';
import { SearchMessageListItemCore } from 'views/search/list/message/search-message-list-item-core';

type SearchMessageListItemProps = {
	completeMessage: MailMessage;
	selected: boolean;
	selecting: boolean;
	toggle: (id: string) => void;
	active?: boolean;
	deselectAll: () => void;
};
export const SearchMessageListItem: FC<SearchMessageListItemProps> = memo(function MessageListItem({
	completeMessage,
	selected,
	selecting,
	toggle,
	active,
	deselectAll
}) {
	const { ref, hasBeenHovered } = useOnMouseHover();
	const itemId = completeMessage.id;
	const folderId = completeMessage.parent;
	const { itemId: messageId } = useParams<{ itemId: string | undefined }>();
	const navigate = useNavigate();

	const shouldReplaceHistory = useMemo(() => itemId === messageId, [messageId, itemId]);

	const zimbraPrefMarkMsgRead = useUserSettings()?.prefs?.zimbraPrefMarkMsgRead !== '-1';

	const previewOnSeparatedWindow = useMsgPreviewOnSeparatedWindowFn({
		messageId: itemId,
		folderId
	});

	const setAsRead = useMsgSetReadFn({
		ids: [itemId],
		shouldReplaceHistory,
		isMessageRead: completeMessage.read,
		folderId
	});

	const onClick = useCallback<MouseEventHandler<HTMLDivElement>>(
		(e) => {
			if (e.isDefaultPrevented()) {
				return;
			}
			if (completeMessage.read === false && zimbraPrefMarkMsgRead) {
				setAsRead.canExecute() && setAsRead.execute();
			}
			navigate(`../message/${completeMessage.id}`, { replace: true });
		},
		[completeMessage.read, completeMessage.id, zimbraPrefMarkMsgRead, navigate, setAsRead]
	);
	const onDoubleClick = useCallback(
		(e: React.MouseEvent) => {
			if (e.isDefaultPrevented()) {
				return;
			}
			const { id, isDraft } = completeMessage;
			if (isDraft) {
				createEditBoard({
					action: EditViewActions.EDIT_AS_DRAFT,
					actionTargetId: id
				});
				return;
			}
			previewOnSeparatedWindow.canExecute() && previewOnSeparatedWindow.execute();
		},
		[previewOnSeparatedWindow, completeMessage]
	);

	return (
		<Container
			ref={ref}
			mainAlignment="flex-start"
			data-testid={`MessageListItem-${completeMessage.id}`}
		>
			{hasBeenHovered ? (
				<MessageListItemActionWrapper
					item={completeMessage}
					active={active}
					onClick={onClick}
					onDoubleClick={onDoubleClick}
					shouldReplaceHistory={shouldReplaceHistory}
				>
					<SearchMessageListItemCore
						completeMessage={completeMessage}
						selected={selected}
						selecting={selecting}
						toggle={toggle}
						folderId={folderId}
					/>
				</MessageListItemActionWrapper>
			) : (
				<SearchMessageListItemCore
					completeMessage={completeMessage}
					selected={selected}
					selecting={selecting}
					toggle={toggle}
					folderId={folderId}
				/>
			)}
		</Container>
	);
});
