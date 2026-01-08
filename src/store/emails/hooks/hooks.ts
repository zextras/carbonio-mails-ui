/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { useEffect, useMemo } from 'react';

import { useUserSettings } from '@zextras/carbonio-shell-ui';
import { debounce } from 'lodash';

import { API_REQUEST_STATUS, DEFAULT_API_DEBOUNCE_TIME } from 'constants/index';
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

type UseCompleteConversationOrFetchParams = {
	conversationId: string;
	folderId?: string;
};

/**
 * Get the conversation from the store or fetch it.
 * Ensures that conversations are fetched if their status indicates they are not yet fulfilled.
 * Returns the conversation along with its fetch status.
 *
 * @param conversationId
 * @param folderId
 * @param shouldMarkAsRead
 */
export function useCompleteConversationOrFetch({
	conversationId,
	folderId
}: UseCompleteConversationOrFetchParams): ConversationWithStatus {
	const shouldMarkAsRead = useUserSettings()?.prefs?.zimbraPrefMarkMsgRead !== '-1';
	const conversation = useConversationById(conversationId);
	const conversationStatus = useConversationStatus(conversationId);

	const requestDebouncedConversation = useMemo(
		() =>
			debounce(
				() => {
					if (conversation && !conversationStatus) {
						searchConvEmailStoreAction(conversationId, folderId, shouldMarkAsRead);
					}
				},
				DEFAULT_API_DEBOUNCE_TIME,
				{ leading: false, trailing: true }
			),
		[conversation, conversationId, conversationStatus, folderId, shouldMarkAsRead]
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

type UseCompleteMessageOrFetchParams = {
	messageId: string;
};

/**
 * Get the message from the store or fetch it.
 * Ensures that incomplete messages are fetched if their status indicates they are not yet fulfilled.
 */
export function useCompleteMessageOrFetch({
	messageId
}: UseCompleteMessageOrFetchParams): MessageWithStatus {
	const shouldMarkAsRead = useUserSettings()?.prefs?.zimbraPrefMarkMsgRead !== '-1';
	const message = useMessageById(messageId);
	const messageStatus = useMessageStatus(messageId);

	const requestDebouncedMessage = useMemo(
		() =>
			debounce(
				() => {
					if (
						messageStatus !== API_REQUEST_STATUS.pending &&
						(!message?.isComplete || messageStatus === undefined)
					) {
						getMessageEmailStoreAction(messageId, shouldMarkAsRead);
					}
				},
				DEFAULT_API_DEBOUNCE_TIME,
				{ leading: false, trailing: true }
			),
		[message?.isComplete, messageId, messageStatus, shouldMarkAsRead]
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
