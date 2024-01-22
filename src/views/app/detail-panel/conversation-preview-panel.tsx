/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { ReactElement, useCallback } from 'react';

import { Container, Shimmer } from '@zextras/carbonio-design-system';
import { map } from 'lodash';

import { ConversationMessagePreview } from './conversation-message-preview';
import { useAppSelector } from '../../../hooks/redux';
import { selectCurrentFolderExpandedStatus } from '../../../store/conversations-slice';
import type { Conversation } from '../../../types';

export const ConversationPreviewPanel = ({
	conversation,
	isInsideExtraWindow,
	convSortOrder
}: {
	conversation: Conversation;
	isInsideExtraWindow: boolean;
	convSortOrder: string;
}): ReactElement => {
	const conversationStatus = useAppSelector(selectCurrentFolderExpandedStatus)[conversation.id];

	const isExpanded = useCallback(
		(index: number): boolean => {
			if (convSortOrder === 'dateAsc') {
				return index === conversation.messages.length - 1;
			}
			return index === 0;
		},
		[convSortOrder, conversation.messages.length]
	);

	return (
		<Container
			style={{ overflowY: 'auto' }}
			height="fill"
			background="gray5"
			padding={{ horizontal: 'large', bottom: 'small', top: 'large' }}
			mainAlignment="flex-start"
		>
			<Container height="fit" mainAlignment="flex-start" background="gray5">
				{conversation && conversationStatus === 'complete' ? (
					<>
						{map(conversation.messages, (message, index) =>
							message ? (
								<ConversationMessagePreview
									idPrefix={conversation.id}
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
