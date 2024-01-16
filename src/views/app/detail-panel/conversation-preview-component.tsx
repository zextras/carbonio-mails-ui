/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { ReactElement, useCallback, useMemo } from 'react';

import { Container, Shimmer } from '@zextras/carbonio-design-system';
import { useUserSettings } from '@zextras/carbonio-shell-ui';
import { map, sortBy } from 'lodash';

import { ConversationMessagePreview } from './conversation-message-preview';
import { useAppSelector } from '../../../hooks/redux';
import { selectCurrentFolderExpandedStatus } from '../../../store/conversations-slice';
import { selectMessages } from '../../../store/messages-slice';
import type { Conversation } from '../../../types';

export const ConversationPreviewPanel = ({
	conversation,
	isInsideExtraWindow
}: {
	conversation: Conversation;
	isInsideExtraWindow: boolean;
}): ReactElement => {
	const settings = useUserSettings();
	const messages = useAppSelector(selectMessages);
	const conversationStatus = useAppSelector(selectCurrentFolderExpandedStatus)[conversation.id];
	const convMessages = useMemo(() => {
		const msgs = map(conversation?.messages, (item) => messages[item.id] ?? item);

		if (settings.prefs.zimbraPrefConversationOrder === 'dateAsc' && msgs?.length > 0) {
			return sortBy(msgs, [(o): string | number => o.date]);
		}
		return msgs ?? [];
	}, [conversation?.messages, settings.prefs.zimbraPrefConversationOrder, messages]);

	const isExpanded = useCallback(
		(index: number): boolean => {
			if (settings.prefs.zimbraPrefConversationOrder === 'dateAsc') {
				return index === convMessages.length - 1;
			}
			return index === 0;
		},
		[convMessages.length, settings.prefs.zimbraPrefConversationOrder]
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
						{map(convMessages, (message, index) =>
							message ? (
								<ConversationMessagePreview
									idPrefix={conversation.id}
									message={message}
									isExpanded={isExpanded(index)}
									isAlone={convMessages?.length === 1}
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
