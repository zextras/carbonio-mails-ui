/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC, useCallback } from 'react';

import styled from '@emotion/styled';
import { Container } from '@zextras/carbonio-design-system';
import { getUserSettings } from '@zextras/carbonio-shell-ui';
import { useNavigate } from 'react-router-dom';

import { API_REQUEST_STATUS } from 'constants/index';
import { useConvPreviewOnSeparatedWindowFn } from 'hooks/actions/use-conv-preview-on-separated-window';
import { useConvSetReadFn } from 'hooks/actions/use-conv-set-read';
import { useMarkAsReadOnClick } from 'hooks/use-mark-as-read-on-click';
import { useOnMouseHover } from 'hooks/use-on-mouse-hover';
import { searchConvEmailStoreAction } from 'store/emails/actions/search-conv-action';
import {
	useConversationById,
	useConversationMessages,
	useConversationStatus
} from 'store/emails/store';
import { ConversationListItemActionWrapper } from 'views/app/folder-panel/conversations/conversation-list-item-wrapper';
import { SearchConversationListItemCore } from 'views/search/list/conversation/search-conversation-list-item-core';
import { SearchConversationMessagesList } from 'views/search/list/conversation/search-conversation-messages-list';

const CollapseElement = styled(Container)<{ $open: boolean }>`
	display: ${({ $open }): string => ($open ? 'block' : 'none')};
`;
type SearchConversationListItemProps = {
	conversationId: string;
	selecting: boolean;
	active: boolean;
	activeItemId?: string;
	selected: boolean;
	index: number;
	onSelect: (index: number, id: string, event: React.MouseEvent) => void;
	onToggleExpanded: (conversationId: string) => void;
	isConversationExpanded: boolean;
};

export const SearchConversationListItem: FC<SearchConversationListItemProps> = ({
	conversationId,
	selecting,
	active,
	activeItemId,
	selected,
	index,
	onSelect,
	onToggleExpanded,
	isConversationExpanded
}) => {
	const conversation = useConversationById(conversationId);
	const { ref, hasBeenHovered } = useOnMouseHover();
	const messages = useConversationMessages(conversationId);
	const conversationStatus = useConversationStatus(conversationId);
	const { parent } = messages[0];
	const navigate = useNavigate();

	const previewOnSeparatedWindow = useConvPreviewOnSeparatedWindowFn({
		conversationId,
		folderId: parent
	});

	const markAsRead = useConvSetReadFn({
		ids: [conversation.id],
		isConversationRead: conversation.read,
		folderId: parent ?? ''
	});

	// unified mark-as-read handler (preference + unread handled inside hook)
	const markConvAsReadHandler = useMarkAsReadOnClick({
		isRead: conversation.read,
		action: markAsRead,
		conditions: [Boolean(conversation)]
	});

	const _onClick = useCallback(
		(e: React.MouseEvent) => {
			if (!e.isDefaultPrevented()) {
				markConvAsReadHandler();
				navigate(`../conversation/${conversationId}`);
			}
		},
		[markConvAsReadHandler, navigate, conversationId]
	);

	const _onDoubleClick = useCallback(
		(e: React.MouseEvent) => {
			if (e.isDefaultPrevented()) {
				return;
			}

			previewOnSeparatedWindow.canExecute() && previewOnSeparatedWindow.execute();
		},

		[previewOnSeparatedWindow]
	);

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
			searchConvEmailStoreAction({ conversationId, html });
		}
	}, [shouldFetchConversation, conversationId]);

	const toggleCollapseElementCallback = useCallback(
		(e: React.MouseEvent<HTMLButtonElement> | React.KeyboardEvent | MouseEvent | KeyboardEvent) => {
			e.preventDefault();
			if (!isConversationExpanded) {
				fetchConversationIfNeeded();
			}
			onToggleExpanded(conversationId);
		},
		[conversationId, onToggleExpanded, isConversationExpanded, fetchConversationIfNeeded]
	);

	return (
		<Container
			ref={ref}
			mainAlignment="flex-start"
			data-testid={`ConversationListItem-${conversationId}`}
		>
			{hasBeenHovered ? (
				<ConversationListItemActionWrapper
					conversation={conversation}
					active={active}
					onClick={_onClick}
					onDoubleClick={_onDoubleClick}
				>
					<SearchConversationListItemCore
						conversation={conversation}
						selected={selected}
						selecting={selecting}
						open={isConversationExpanded}
						toggleCollapseElementCallback={toggleCollapseElementCallback}
						parent={messages[0].parent}
						index={index}
						onSelect={onSelect}
					/>
				</ConversationListItemActionWrapper>
			) : (
				<Container onClick={_onClick}>
					<SearchConversationListItemCore
						conversation={conversation}
						selected={selected}
						selecting={selecting}
						open={isConversationExpanded}
						toggleCollapseElementCallback={toggleCollapseElementCallback}
						parent={messages[0].parent}
						index={index}
						onSelect={onSelect}
					/>
				</Container>
			)}
			{isConversationExpanded && (
				<CollapseElement
					$open={isConversationExpanded}
					data-testid="ConversationExpander"
					padding={{ left: 'extralarge' }}
					height="auto"
				>
					<SearchConversationMessagesList
						activeItemId={activeItemId}
						length={conversation.messagesInConversation}
						messages={messages}
						conversationStatus={conversationStatus}
					/>
				</CollapseElement>
			)}
		</Container>
	);
};
