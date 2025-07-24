/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { memo, useCallback, useMemo, useState } from 'react';

import { Container } from '@zextras/carbonio-design-system';
import { useUserSettings } from '@zextras/carbonio-shell-ui';
import { debounce } from 'lodash';
import { useNavigate, useParams } from 'react-router-dom';
import styled from 'styled-components';

import { API_REQUEST_STATUS, MAILS_ROUTE } from 'constants/index';
import { useConvPreviewOnSeparatedWindowFn } from 'hooks/actions/use-conv-preview-on-separated-window';
import { useConvSetReadFn } from 'hooks/actions/use-conv-set-read';
import { useOnMouseHover } from 'hooks/use-on-mouse-hover';
import { searchConvEmailStoreAction } from 'store/emails/actions/search-conv-action';
import { useConversationMessages, useConversationStatus } from 'store/emails/store';
import { NormalizedConversation } from 'types/conversations/index.d';
import { ConversationListItemCore } from 'views/app/folder-panel/conversations/conversation-list-item-core';
import { ConversationListItemActionWrapper } from 'views/app/folder-panel/conversations/conversation-list-item-wrapper';
import { ConversationMessagesList } from 'views/app/folder-panel/conversations/conversation-messages-list';

export type ConversationListItemProps = {
	conversation: NormalizedConversation;
	selected: boolean;
	selecting: boolean;
	toggleMultipleSelection: (id: string) => void;
	active?: boolean;
	isSearchModule?: boolean;
	activeItemId?: string;
	dragImageRef?: React.RefObject<HTMLInputElement>;
	setDraggedIds?: (ids: Record<string, boolean>) => void;
	folderId?: string;
};
const CollapseElement = styled(Container)<{ $open: boolean }>`
	display: ${({ $open }): string => ($open ? 'block' : 'none')};
`;

export const ConversationListItem = memo(function ConversationListItem({
	conversation,
	selected,
	selecting,
	toggleMultipleSelection,
	active,
	isSearchModule,
	activeItemId,
	dragImageRef,
	folderId,
	setDraggedIds
}: ConversationListItemProps): React.JSX.Element {
	const { itemId } = useParams<{ itemId: string }>();
	const navigate = useNavigate();
	const [open, setOpen] = useState(false);
	const messages = useConversationMessages(conversation.id);
	const folderParent = folderId ?? messages?.[0]?.parent;

	const { ref, hasBeenHovered } = useOnMouseHover();

	const markAsRead = useConvSetReadFn({
		ids: [conversation.id],
		isConversationRead: conversation.read,
		folderId: folderId ?? ''
	});

	const conversationId = conversation.id;
	const previewOnSeparatedWindow = useConvPreviewOnSeparatedWindowFn({
		conversationId,
		folderId: folderParent
	});

	const conversationStatus = useConversationStatus(conversationId);

	const zimbraPrefMarkMsgRead = useUserSettings()?.prefs?.zimbraPrefMarkMsgRead !== '-1';

	const toggleCollapseElementCallback = useCallback(
		(e: React.MouseEvent<HTMLButtonElement> | React.KeyboardEvent | MouseEvent | KeyboardEvent) => {
			e.preventDefault();
			setOpen((currentlyOpen) => {
				if (
					!currentlyOpen &&
					conversationStatus !== API_REQUEST_STATUS.fulfilled &&
					conversationStatus !== API_REQUEST_STATUS.pending
				) {
					searchConvEmailStoreAction(conversationId);
				}
				return !currentlyOpen;
			});
		},
		[conversationId, conversationStatus]
	);

	const debouncedPushHistory = useMemo(
		() =>
			debounce(
				() => navigate(`/${MAILS_ROUTE}/folder/${folderParent}/conversation/${conversation.id}`),
				200,
				{
					leading: false,
					trailing: true
				}
			),
		[navigate, folderParent, conversation.id]
	);

	const _onClick = useCallback(
		(e: React.MouseEvent<HTMLDivElement>) => {
			if (!e.isDefaultPrevented()) {
				if (conversation?.read === false && zimbraPrefMarkMsgRead) {
					markAsRead.canExecute() && markAsRead.execute();
				}
				debouncedPushHistory();
			}
		},
		[conversation?.read, zimbraPrefMarkMsgRead, debouncedPushHistory, markAsRead]
	);

	const _onDoubleClick = useCallback(
		(e: React.MouseEvent<HTMLDivElement>) => {
			if (e.isDefaultPrevented()) {
				return;
			}
			debouncedPushHistory();
			previewOnSeparatedWindow.canExecute() && previewOnSeparatedWindow.execute();
		},

		[debouncedPushHistory, previewOnSeparatedWindow]
	);

	const shouldReplaceHistory = useMemo(() => itemId === conversation.id, [conversation.id, itemId]);

	return (
		<Container
			ref={ref}
			mainAlignment="flex-start"
			data-testid={`ConversationListItem-${conversation.id}`}
		>
			{hasBeenHovered ? (
				<ConversationListItemActionWrapper
					conversation={conversation}
					active={active}
					onClick={_onClick}
					onDoubleClick={_onDoubleClick}
					shouldReplaceHistory={shouldReplaceHistory}
				>
					<ConversationListItemCore
						conversation={conversation}
						selected={selected}
						selecting={selecting}
						toggleMultipleSelection={toggleMultipleSelection}
						folderParent={folderParent}
						open={open}
						toggleCollapseElementCallback={toggleCollapseElementCallback}
					/>
				</ConversationListItemActionWrapper>
			) : (
				<ConversationListItemCore
					conversation={conversation}
					selected={selected}
					selecting={selecting}
					toggleMultipleSelection={toggleMultipleSelection}
					folderParent={folderParent}
					open={open}
					toggleCollapseElementCallback={toggleCollapseElementCallback}
				/>
			)}
			{open && conversation.messagesInConversation > 1 && (
				<CollapseElement
					$open={open}
					data-testid="ConversationExpander"
					padding={{ left: 'extralarge' }}
					height="auto"
				>
					<ConversationMessagesList
						activeItemId={activeItemId}
						length={conversation.messagesInConversation}
						messages={messages}
						conversationStatus={conversationStatus}
						folderId={folderParent}
						dragImageRef={dragImageRef}
						isSearchModule={isSearchModule}
						setDraggedIds={setDraggedIds}
					/>
				</CollapseElement>
			)}
		</Container>
	);
});
