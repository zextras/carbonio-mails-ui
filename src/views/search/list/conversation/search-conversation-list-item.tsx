/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC, useCallback, useState } from 'react';

import { Container } from '@zextras/carbonio-design-system';
import { useUserSettings } from '@zextras/carbonio-shell-ui';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import { useConvPreviewOnSeparatedWindowFn } from 'hooks/actions/use-conv-preview-on-separated-window';
import { useConvSetReadFn } from 'hooks/actions/use-conv-set-read';
import { useOnMouseHover } from 'hooks/use-on-mouse-hover';
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
};

export const SearchConversationListItem: FC<SearchConversationListItemProps> = ({
	conversationId,
	selecting,
	active,
	activeItemId,
	selected,
	index,
	onSelect
}) => {
	const conversation = useConversationById(conversationId);
	const { ref, hasBeenHovered } = useOnMouseHover();
	const [open, setOpen] = useState(false);
	const messages = useConversationMessages(conversationId);
	const conversationStatus = useConversationStatus(conversationId);
	const { parent } = messages[0];
	const navigate = useNavigate();

	const zimbraPrefMarkMsgRead = useUserSettings()?.prefs?.zimbraPrefMarkMsgRead !== '-1';

	const previewOnSeparatedWindow = useConvPreviewOnSeparatedWindowFn({
		conversationId,
		folderId: parent
	});

	const markAsRead = useConvSetReadFn({
		ids: [conversation.id],
		isConversationRead: conversation.read,
		folderId: parent ?? ''
	});

	const _onClick = useCallback(
		(e: React.MouseEvent) => {
			if (!e.isDefaultPrevented()) {
				if (conversation?.read === false && zimbraPrefMarkMsgRead) {
					markAsRead.canExecute() && markAsRead.execute();
				}
				navigate(`../conversation/${conversationId}`);
			}
		},
		[conversation?.read, zimbraPrefMarkMsgRead, navigate, conversationId, markAsRead]
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
						open={open}
						setOpen={setOpen}
						conversationStatus={conversationStatus}
						parent={messages[0].parent}
						index={index}
						onSelect={onSelect}
					/>
				</ConversationListItemActionWrapper>
			) : (
				<SearchConversationListItemCore
					conversation={conversation}
					selected={selected}
					selecting={selecting}
					open={open}
					setOpen={setOpen}
					conversationStatus={conversationStatus}
					parent={messages[0].parent}
					index={index}
					onSelect={onSelect}
				/>
			)}
			{open && (
				<CollapseElement
					$open={open}
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
