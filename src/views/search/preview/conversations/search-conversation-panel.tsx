/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { ReactElement, useCallback } from 'react';

import { Container, Shimmer } from '@zextras/carbonio-design-system';
import { map } from 'lodash';

import { API_REQUEST_STATUS } from '../../../../constants';
import { useConversationStatus } from '../../../../store/zustand/message-store/store';
import { NormalizedConversation } from '../../../../types';
import { ConversationMessagePreview } from '../../../app/detail-panel/conversation-message-preview';

export const SearchConversationPreviewPanel = ({
	conversation,
	isInsideExtraWindow,
	convSortOrder
}: {
	conversation: NormalizedConversation;
	isInsideExtraWindow: boolean;
	convSortOrder: string;
}): ReactElement => {
	const conversationStatus = useConversationStatus(conversation.id);

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
			background={'gray5'}
			padding={{ horizontal: 'large', bottom: 'small', top: 'large' }}
			mainAlignment="flex-start"
		>
			<Container height="fit" mainAlignment="flex-start" background={'gray5'}>
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
