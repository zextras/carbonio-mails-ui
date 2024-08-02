/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, useCallback } from 'react';

import { Container, Shimmer } from '@zextras/carbonio-design-system';
import { useUserSettings } from '@zextras/carbonio-shell-ui';
import { map } from 'lodash';
import { useParams } from 'react-router-dom';

import { SearchConversationMessagePanel } from './search-conversation-message-panel';
import { API_REQUEST_STATUS } from '../../../constants';
import { useCompleteConversation } from '../../../store/zustand/search/hooks/hooks';
import { useExtraWindow } from '../../app/extra-windows/use-extra-window';
import { SearchPreviewPanelHeader } from '../preview/search-preview-panel-header';

type SearchConversationPanelProps = {
	conversationId?: string;
	folderId?: string;
};

export const SearchConversationPanel: FC<SearchConversationPanelProps> = (props) => {
	const { conversationId } = useParams<{ conversationId: string }>();

	const { isInsideExtraWindow } = useExtraWindow();
	const { conversation, conversationStatus } = useCompleteConversation(conversationId);

	const settings = useUserSettings();
	const convSortOrder = settings.prefs.zimbraPrefConversationOrder as string;

	const isExpanded = useCallback(
		(index: number): boolean => {
			if (convSortOrder === 'dateAsc') {
				return index === conversation.messages.length - 1;
			}
			return index === 0;
		},
		[convSortOrder, conversation.messages.length]
	);

	const { messages } = conversation;

	return (
		<Container orientation="vertical" mainAlignment="flex-start" crossAlignment="flex-start">
			<>
				{!isInsideExtraWindow && <SearchPreviewPanelHeader item={conversation} />}
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
										convMessage={message}
										isExpanded={isExpanded(index)}
										isAlone={conversation.messages?.length === 1}
										isInsideExtraWindow={isInsideExtraWindow}
									/>
								))}
							</>
						)}
						{conversationStatus === API_REQUEST_STATUS.pending && (
							<Shimmer.Logo size="large" data-testid={`shimmer-conversation-${conversationId}`} />
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
