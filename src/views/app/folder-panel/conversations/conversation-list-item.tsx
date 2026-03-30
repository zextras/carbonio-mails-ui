/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { memo, useCallback, useMemo } from 'react';

import styled from '@emotion/styled';
import { Container } from '@zextras/carbonio-design-system';
import { getUserSettings } from '@zextras/carbonio-shell-ui';
import { debounce } from 'lodash';
import { useNavigate } from 'react-router-dom';

import { API_REQUEST_STATUS, MAILS_ROUTE } from 'constants/index';
import { useConvPreviewOnSeparatedWindowFn } from 'hooks/actions/use-conv-preview-on-separated-window';
import { useConvSetReadFn } from 'hooks/actions/use-conv-set-read';
import { useMarkAsReadOnClick } from 'hooks/use-mark-as-read-on-click';
import { useOnMouseHover } from 'hooks/use-on-mouse-hover';
import { searchConvEmailStoreAction } from 'store/emails/actions/search-conv-action';
import { useConversationMessages, useConversationStatus } from 'store/emails/store';
import { NormalizedConversation } from 'types/conversations';
import { ConversationListItemCore } from 'views/app/folder-panel/conversations/conversation-list-item-core';
import { ConversationListItemActionWrapper } from 'views/app/folder-panel/conversations/conversation-list-item-wrapper';
import { ConversationMessagesList } from 'views/app/folder-panel/conversations/conversation-messages-list';

export type ConversationListItemProps = {
	conversation: NormalizedConversation;
	selected: boolean;
	selecting: boolean;
	active?: boolean;
	isSearchModule?: boolean;
	activeItemId?: string;
	dragImageRef?: React.RefObject<HTMLInputElement>;
	setDraggedIds?: (ids: Record<string, boolean>) => void;
	folderId?: string;
	index: number;
	onSelect: (index: number, id: string, event: React.MouseEvent) => void;
	onToggleExpanded?: (conversationId: string) => void;
	isConversationExpanded: boolean;
};
const CollapseElement = styled(Container)<{ $open: boolean }>`
	display: ${({ $open }): string => ($open ? 'block' : 'none')};
`;

export const ConversationListItem = memo(function ConversationListItem({
	conversation,
	selected,
	selecting,
	active,
	isSearchModule,
	activeItemId,
	dragImageRef,
	folderId,
	setDraggedIds,
	index,
	onSelect,
	onToggleExpanded,
	isConversationExpanded
}: ConversationListItemProps): React.JSX.Element {
	const navigate = useNavigate();
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

	const shouldFetchConversation = useCallback(
		(): boolean =>
			conversationStatus !== API_REQUEST_STATUS.fulfilled &&
			conversationStatus !== API_REQUEST_STATUS.pending,
		[conversationStatus]
	);

	const fetchConversationIfNeeded = useCallback(() => {
		if (shouldFetchConversation()) {
			const prefs = getUserSettings()?.prefs;
			const html = prefs?.zimbraPrefMessageViewHtmlPreferred === 'TRUE';
			searchConvEmailStoreAction({ conversationId, folderId: folderParent, html });
		}
	}, [shouldFetchConversation, conversationId, folderParent]);

	const toggleCollapseElementCallback = useCallback(
		(e: React.MouseEvent<HTMLButtonElement> | React.KeyboardEvent | MouseEvent | KeyboardEvent) => {
			e.preventDefault();
			if (!isConversationExpanded) {
				fetchConversationIfNeeded();
			}
			onToggleExpanded?.(conversationId);
		},
		[conversationId, onToggleExpanded, isConversationExpanded, fetchConversationIfNeeded]
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

	const markConvAsReadHandler = useMarkAsReadOnClick({
		isRead: conversation.read,
		action: markAsRead,
		conditions: [!shouldFetchConversation()]
	});

	const _onClick = useCallback(
		(e: React.MouseEvent<HTMLDivElement>) => {
			if (!e.isDefaultPrevented()) {
				markConvAsReadHandler();
				debouncedPushHistory();
			}
		},
		[markConvAsReadHandler, debouncedPushHistory]
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
				>
					<ConversationListItemCore
						conversation={conversation}
						selected={selected}
						selecting={selecting}
						folderParent={folderParent}
						open={isConversationExpanded}
						toggleCollapseElementCallback={toggleCollapseElementCallback}
						index={index}
						onSelect={onSelect}
					/>
				</ConversationListItemActionWrapper>
			) : (
				<Container
					data-testid={`clickable-conversation-list-item-${conversationId}`}
					onClick={_onClick}
				>
					<ConversationListItemCore
						conversation={conversation}
						selected={selected}
						selecting={selecting}
						folderParent={folderParent}
						open={isConversationExpanded}
						toggleCollapseElementCallback={toggleCollapseElementCallback}
						index={index}
						onSelect={onSelect}
					/>
				</Container>
			)}
			{isConversationExpanded && conversation.messagesInConversation > 1 && (
				<CollapseElement
					$open={isConversationExpanded}
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
