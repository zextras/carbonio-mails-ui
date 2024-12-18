/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useCallback } from 'react';

import { Container, Shimmer } from '@zextras/carbonio-design-system';
import { useUserSettings } from '@zextras/carbonio-shell-ui';
import { map } from 'lodash';

import { ConversationMessagePreview } from './conversation-message-preview';
import { API_REQUEST_STATUS } from '../../../constants';
import { useCompleteConversation } from '../../../store/zustand/emails/hooks/hooks';

export const ConversationPreviewPanel = ({
	conversationId,
	isInsideExtraWindow
}: {
	conversationId: string;
	isInsideExtraWindow: boolean;
}): React.JSX.Element => {
	const settings = useUserSettings();
	const convSortOrder = settings.prefs.zimbraPrefConversationOrder as string;
	const { conversation, conversationStatus } = useCompleteConversation(conversationId);

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
		<Container
			style={{ overflowY: 'auto' }}
			height="fill"
			background="gray5"
			padding={{ horizontal: 'large', bottom: 'small', top: 'large' }}
			mainAlignment="flex-start"
		>
			<Container height="100%" mainAlignment="flex-start" background="gray5">
				{conversation && conversationStatus === API_REQUEST_STATUS.fulfilled ? (
					<>
						{map(messages, (message, index) =>
							message ? (
								<ConversationMessagePreview
									key={message.id}
									convMessage={message}
									isExpanded={isExpanded(index)}
									isAlone={conversation.messages?.length === 1}
									isInsideExtraWindow={isInsideExtraWindow}
								/>
							) : (
								<Shimmer.Logo size="large" />
							)
						)}
					</>
				) : (
					<></>
				)}
			</Container>
		</Container>
	);
};
