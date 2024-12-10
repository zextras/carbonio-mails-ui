/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { ReactElement, useCallback, useEffect, useMemo } from 'react';

import { Container, Shimmer } from '@zextras/carbonio-design-system';
import { useUserSettings } from '@zextras/carbonio-shell-ui';
import { debounce, map } from 'lodash';

import { ConversationMessagePreview } from './conversation-message-preview';
import { API_REQUEST_STATUS, DEFAULT_API_DEBOUNCE_TIME } from '../../../constants';
import { useAppDispatch, useAppSelector } from '../../../hooks/redux';
import { searchConv } from '../../../store/actions';
import { selectConversationExpandedStatus } from '../../../store/conversations-slice';
import type { Conversation, MailsStateType } from '../../../types';

export const ConversationPreviewPanel = ({
	conversation,
	isInsideExtraWindow
}: {
	conversation: Conversation;
	isInsideExtraWindow: boolean;
}): ReactElement => {
	const dispatch = useAppDispatch();
	const conversationStatus = useAppSelector((state: MailsStateType) =>
		selectConversationExpandedStatus(state, conversation.id)
	);
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

	const requestDebouncedConversation = useMemo(
		() =>
			debounce(
				() => {
					if (
						(conversationStatus !== API_REQUEST_STATUS.fulfilled &&
							conversationStatus !== API_REQUEST_STATUS.pending) ||
						!conversationStatus
					) {
						dispatch(searchConv({ conversationId: conversation.id, fetch: 'all' }));
					}
				},
				DEFAULT_API_DEBOUNCE_TIME,
				{ leading: false, trailing: true }
			),
		[conversation.id, conversationStatus, dispatch]
	);

	const sortSign = useMemo(() => (convSortOrder === 'dateDesc' ? -1 : 1), [convSortOrder]);

	const messages = conversation.messages.slice().sort((a, b) => sortSign * (a.date - b.date));

	useEffect(() => {
		requestDebouncedConversation();
		return () => requestDebouncedConversation.cancel();
	}, [requestDebouncedConversation]);

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
