/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, memo, MouseEventHandler, useCallback } from 'react';

import { Container } from '@zextras/carbonio-design-system';
import { useNavigate } from 'react-router-dom';

import { useShouldReplaceHistory } from '../../../../hooks/use-should-replace-history';
import { useMsgEditDraftFn } from 'hooks/actions/use-msg-edit-draft';
import { useMsgPreviewOnSeparatedWindowFn } from 'hooks/actions/use-msg-preview-on-separated-window';
import { useMsgSetReadFn } from 'hooks/actions/use-msg-set-read';
import { useMarkAsReadOnClick } from 'hooks/use-mark-as-read-on-click';
import { useOnMouseHover } from 'hooks/use-on-mouse-hover';
import { MailMessage } from 'types/messages';
import { MessageListItemActionWrapper } from 'views/app/folder-panel/messages/message-list-item-action-wrapper';
import { SearchMessageListItemCore } from 'views/search/list/message/search-message-list-item-core';

type SearchMessageListItemProps = {
	completeMessage: MailMessage;
	selected: boolean;
	selecting: boolean;
	index: number;
	onSelect: (index: number, id: string, event: React.MouseEvent) => void;
	active?: boolean;
};
export const SearchMessageListItem: FC<SearchMessageListItemProps> = memo(function MessageListItem({
	completeMessage,
	selected,
	selecting,
	index,
	onSelect,
	active
}) {
	const { ref, hasBeenHovered } = useOnMouseHover();
	const itemId = completeMessage.id;
	const folderId = completeMessage.parent;
	const navigate = useNavigate();

	const shouldReplaceHistory = useShouldReplaceHistory(completeMessage);

	const previewOnSeparatedWindow = useMsgPreviewOnSeparatedWindowFn({
		messageId: itemId,
		folderId
	});

	const editDraft = useMsgEditDraftFn(itemId, completeMessage.isScheduled, folderId);

	const setAsRead = useMsgSetReadFn({
		ids: [itemId],
		shouldReplaceHistory,
		isMessageRead: completeMessage.read,
		folderId
	});

	const markAsReadHandler = useMarkAsReadOnClick({
		isRead: completeMessage.read,
		action: setAsRead,
		conditions: [completeMessage.isComplete ?? true]
	});

	const onClick = useCallback<MouseEventHandler<HTMLDivElement>>(
		(e) => {
			if (e.isDefaultPrevented()) {
				return;
			}
			markAsReadHandler();
			navigate(`../message/${completeMessage.id}`, { replace: true });
		},
		[completeMessage.id, markAsReadHandler, navigate]
	);
	const onDoubleClick = useCallback(
		(e: React.MouseEvent) => {
			if (e.isDefaultPrevented()) {
				return;
			}
			const { isDraft } = completeMessage;
			if (isDraft) {
				editDraft.canExecute() && editDraft.execute();
				return;
			}
			previewOnSeparatedWindow.canExecute() && previewOnSeparatedWindow.execute();
		},
		[previewOnSeparatedWindow, completeMessage, editDraft]
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
						onSelect={onSelect}
						index={index}
						folderId={folderId}
					/>
				</MessageListItemActionWrapper>
			) : (
				<Container
					onClick={onClick}
					onDoubleClick={onDoubleClick}
					data-testid={`MessageListItemWithoutActions-${completeMessage.id}`}
				>
					<SearchMessageListItemCore
						completeMessage={completeMessage}
						selected={selected}
						selecting={selecting}
						onSelect={onSelect}
						index={index}
						folderId={folderId}
					/>
				</Container>
			)}
		</Container>
	);
});
