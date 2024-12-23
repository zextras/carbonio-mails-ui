/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useCallback } from 'react';

import { Container } from '@zextras/carbonio-design-system';
import { useUserSettings } from '@zextras/carbonio-shell-ui';
import { map } from 'lodash';

import { ConversationMessagePreview } from './conversation-message-preview';
import { NormalizedConversation } from '../../../types';

export const ConversationPreviewPanel = ({
	conversation,
	isInsideExtraWindow
}: {
	conversation: NormalizedConversation;
	isInsideExtraWindow: boolean;
}): React.JSX.Element => {
	const settings = useUserSettings();
	const convSortOrder = settings.prefs.zimbraPrefConversationOrder as string;

	const isExpanded = useCallback(
		(index: number): boolean => {
			if (convSortOrder === 'dateAsc') {
				return index === conversation.messages.length - 1;
			}
			return index === 0;
		},
		[convSortOrder, conversation?.messages?.length]
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
						<></>
					)
				)}
			</Container>
		</Container>
	);
};
