/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useCallback } from 'react';

import { Container } from '@zextras/carbonio-design-system';
import { useUserSettings } from '@zextras/carbonio-shell-ui';
import { map } from 'lodash';
import { useNavigate, useParams } from 'react-router-dom';

import { API_REQUEST_STATUS, SEARCH_ROUTE } from 'constants/index';
import { useCompleteConversationOrFetch } from 'store/emails/hooks/hooks';
import {
	SearchDetailPanelConversationRouteParams,
	SearchDetailPanelRouteParams
} from 'types/routes';
import { SearchConversationMessagePanel } from 'views/search/panel/conversation/search-conversation-message-panel';
import { SearchPanelHeader } from 'views/search/parts/search-panel-header';

export const SearchConversationPanel = (): React.JSX.Element => {
	const { conversationId } =
		useParams<SearchDetailPanelRouteParams>() as SearchDetailPanelConversationRouteParams;
	const navigate = useNavigate();

	const zimbraPrefMarkMsgRead = useUserSettings()?.prefs?.zimbraPrefMarkMsgRead !== '-1';

	const { conversation, conversationStatus } = useCompleteConversationOrFetch({
		conversationId,
		shouldMarkAsRead: zimbraPrefMarkMsgRead
	});

	const settings = useUserSettings();
	const convSortOrder = settings.prefs.zimbraPrefConversationOrder as string;

	const isExpanded = useCallback(
		(index: number): boolean => {
			if (convSortOrder === 'dateAsc' && conversation?.messageIds) {
				return index === conversation.messageIds.length - 1;
			}
			return index === 0;
		},
		[convSortOrder, conversation?.messageIds]
	);

	if (!conversation) {
		navigate(`/${SEARCH_ROUTE}`, { replace: true });
		return <></>;
	}

	const { messageIds } = conversation;

	return (
		<Container
			orientation="vertical"
			mainAlignment="flex-start"
			crossAlignment="flex-start"
			data-testid={`SearchConversationPanel-${conversationId}`}
		>
			<>
				<SearchPanelHeader item={conversation} />
				<Container
					style={{ overflowY: 'auto' }}
					height="fill"
					background="gray5"
					padding={{ horizontal: 'large', bottom: 'small', top: 'large' }}
					mainAlignment="flex-start"
				>
					<Container height="fit" mainAlignment="flex-start" background="gray5">
						{conversation && conversationStatus === API_REQUEST_STATUS.fulfilled && (
							<>
								{map(messageIds, (messageId, index) => (
									<SearchConversationMessagePanel
										key={messageId}
										convMessageId={messageId}
										isExpanded={isExpanded(index)}
										isAlone={conversation.messageIds?.length === 1}
									/>
								))}
							</>
						)}
						{(conversationStatus === API_REQUEST_STATUS.error || conversationStatus === null) && (
							<div data-testid="empty-fragment" />
						)}
					</Container>
				</Container>
			</>
		</Container>
	);
};
