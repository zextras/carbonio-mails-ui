/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { useEffect, useMemo, useRef } from 'react';

import { useUserSettings } from '@zextras/carbonio-shell-ui';
import { debounce } from 'lodash';

import { API_REQUEST_STATUS, DEFAULT_API_DEBOUNCE_TIME } from 'constants/index';
import { convActionEmailStoreAction } from 'store/emails/actions/conv-action-action';
import { getMessageEmailStoreAction } from 'store/emails/actions/get-message';
import { searchConvEmailStoreAction } from 'store/emails/actions/search-conv-action';
import {
	useConversationById,
	useConversationStatus,
	useMessageById,
	useMessageStatus
} from 'store/emails/store';
import {
	IncompleteMessage,
	MailMessage,
	NormalizedConversation,
	SearchRequestStatus
} from 'types/index.d';

type ConversationWithStatus = {
	conversation: NormalizedConversation;
	conversationStatus: SearchRequestStatus;
};
/**
 * Provides a complete conversation with its status.
 * If the conversation is not in the store, it will be fetched.
 *
 */
export function useCompleteConversationOrFetch(
	conversationId: string,
	folderId?: string
): ConversationWithStatus {
	const conversation = useConversationById(conversationId);
	const conversationStatus = useConversationStatus(conversationId);
	const settings = useUserSettings();
	const prefMarkMsgRead = settings?.prefs?.zimbraPrefMarkMsgRead !== '-1';
	const prevConversationIdRef = useRef<string | null>(null);
	const hasNavigated = prevConversationIdRef.current !== conversationId;

	const requestDebouncedConversation = useMemo(
		() =>
			debounce(
				() => {
					if (conversation && !conversationStatus) {
						const shouldMarkAsRead = !conversation.read && prefMarkMsgRead;
						searchConvEmailStoreAction(conversationId, folderId, shouldMarkAsRead);
					} else if (
						hasNavigated &&
						conversation &&
						!conversation.read &&
						conversationStatus === API_REQUEST_STATUS.fulfilled &&
						prefMarkMsgRead
					) {
						convActionEmailStoreAction({
							operation: 'read',
							ids: [conversationId]
						});
					}
					prevConversationIdRef.current = conversationId;
				},
				DEFAULT_API_DEBOUNCE_TIME,
				{ leading: false, trailing: true }
			),
		[conversation, conversationId, conversationStatus, folderId, prefMarkMsgRead, hasNavigated]
	);
	useEffect(() => {
		requestDebouncedConversation();
		return () => {
			requestDebouncedConversation.cancel();
		};
	}, [requestDebouncedConversation]);

	return {
		conversation,
		conversationStatus
	};
}

type MessageWithStatus = {
	message: MailMessage | IncompleteMessage | undefined;
	messageStatus: SearchRequestStatus;
};

/**
 * Get the message from the store or fetch it.
 * Ensures that incomplete messages are fetched if their status indicates they are not yet fulfilled.
 */
export function useCompleteMessageOrFetch(messageId: string): MessageWithStatus {
	const message = useMessageById(messageId);
	const messageStatus = useMessageStatus(messageId);
	const settings = useUserSettings();
	const prefMarkMsgRead = settings?.prefs?.zimbraPrefMarkMsgRead !== '-1';
	const prevMessageIdRef = useRef<string | null>(null);

	const requestDebouncedMessage = useMemo(
		() =>
			debounce(
				() => {
					if (
						messageStatus !== API_REQUEST_STATUS.pending &&
						(!message?.isComplete || messageStatus === undefined)
					) {
						const shouldMarkAsRead = !message?.read && prefMarkMsgRead;
						getMessageEmailStoreAction(messageId, shouldMarkAsRead);
					}
					// Note: For standalone messages marked as unread, we mark them as incomplete
					// so they will be refetched above with read=1
					// For conversation messages, the ConvAction handles marking as read
					prevMessageIdRef.current = messageId;
				},
				DEFAULT_API_DEBOUNCE_TIME,
				{ leading: false, trailing: true }
			),
		[message, messageId, messageStatus, prefMarkMsgRead]
	);

	useEffect(() => {
		requestDebouncedMessage();
		return () => {
			requestDebouncedMessage.cancel();
		};
	}, [requestDebouncedMessage]);

	return {
		message,
		messageStatus
	};
}
