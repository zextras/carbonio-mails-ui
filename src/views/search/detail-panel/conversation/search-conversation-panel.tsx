/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useCallback } from 'react';

import { useUserSettings } from '@zextras/carbonio-shell-ui';
import { map } from 'lodash';
import { useNavigate, useParams } from 'react-router-dom';

import { SearchConversationMessagePanel } from './search-conversation-message-panel';
import { DetailPanelBody } from '../../../../components/detail-panel/detail-panel-body';
import { DetailPanelBodyContainer } from '../../../../components/detail-panel/detail-panel-body-container';
import { DetailPanelContainer } from '../../../../components/detail-panel/detail-panel-container';
import { API_REQUEST_STATUS, SEARCH_ROUTE } from 'constants/index';
import { useCompleteConversationOrFetch } from 'store/emails/hooks/hooks';
import {
	SearchDetailPanelConversationRouteParams,
	SearchDetailPanelRouteParams
} from 'types/routes';
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
	const conversationLoaded = conversation && conversationStatus === API_REQUEST_STATUS.fulfilled;
	const conversationErrorOrPending =
		conversationStatus === API_REQUEST_STATUS.error || conversationStatus === null;

	return (
		<DetailPanelContainer>
			<SearchPanelHeader item={conversation} />
			<DetailPanelBodyContainer>
				<DetailPanelBody>
					{conversationLoaded && (
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
					{conversationErrorOrPending && <div data-testid="empty-fragment" />}
				</DetailPanelBody>
			</DetailPanelBodyContainer>
		</DetailPanelContainer>
	);
};
