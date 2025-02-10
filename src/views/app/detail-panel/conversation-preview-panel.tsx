/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useCallback } from 'react';

import { Container } from '@zextras/carbonio-design-system';
import { useUserSettings } from '@zextras/carbonio-shell-ui';
import { map } from 'lodash';

import { ConversationMessagePreviewWrapper } from './conversation-message-preview-wrapper';
import { Spinner } from '../../../assets/spinner';
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
				return index === conversation.messageIds.length - 1;
			}
			return index === 0;
		},
		[convSortOrder, conversation?.messageIds?.length]
	);

	const { messageIds } = conversation;

	return (
		<Container
			style={{ overflowY: 'auto' }}
			height="fill"
			background="gray5"
			padding={{ horizontal: 'large', bottom: 'small', top: 'large' }}
			mainAlignment="flex-start"
		>
			<Container height="100%" mainAlignment="flex-start" background="gray5">
				{map(messageIds, (convMessageId, index) =>
					convMessageId ? (
						<ConversationMessagePreviewWrapper
							key={convMessageId}
							convMessageId={convMessageId}
							isExpanded={isExpanded(index)}
							isAlone={conversation.messageIds?.length === 1}
							isInsideExtraWindow={isInsideExtraWindow}
						/>
					) : (
						<Spinner />
					)
				)}
			</Container>
		</Container>
	);
};
