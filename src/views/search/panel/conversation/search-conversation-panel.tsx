/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useCallback } from 'react';

import { Container } from '@zextras/carbonio-design-system';
import { replaceHistory, useUserSettings } from '@zextras/carbonio-shell-ui';
import { map } from 'lodash';
import { useParams } from 'react-router-dom';

import { SearchConversationMessagePanel } from './search-conversation-message-panel';
import { API_REQUEST_STATUS } from '../../../../constants';
import { useCompleteConversation } from '../../../../store/zustand/search/hooks/hooks';
import { useExtraWindow } from '../../../app/extra-windows/use-extra-window';
import { SearchExtraWindowPanelHeader } from '../../extra-window/search-extra-window-panel-header';

export const SearchConversationPanel = (): React.JSX.Element => {
	const { conversationId } = useParams<{ conversationId: string }>();

	const { isInsideExtraWindow } = useExtraWindow();
	const { conversation, conversationStatus } = useCompleteConversation(conversationId);

	const settings = useUserSettings();
	const convSortOrder = settings.prefs.zimbraPrefConversationOrder as string;

	const isExpanded = useCallback(
		(index: number): boolean => {
			if (convSortOrder === 'dateAsc' && conversation?.messages) {
				return index === conversation.messages.length - 1;
			}
			return index === 0;
		},
		[convSortOrder, conversation?.messages]
	);

	if (!conversation) {
		replaceHistory({
			path: '/',
			route: 'search'
		});
		return <></>;
	}

	const { messages } = conversation;

	return (
		<Container
			orientation="vertical"
			mainAlignment="flex-start"
			crossAlignment="flex-start"
			data-testid={`SearchConversationPanel-${conversationId}`}
		>
			<>
				{!isInsideExtraWindow && <SearchExtraWindowPanelHeader item={conversation} />}
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
								{map(messages, (message, index) => (
									<SearchConversationMessagePanel
										key={message.id}
										convMessageId={message.id}
										isExpanded={isExpanded(index)}
										isAlone={conversation.messages?.length === 1}
										isInsideExtraWindow={isInsideExtraWindow}
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
