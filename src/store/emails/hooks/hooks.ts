/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { useEffect, useMemo } from 'react';

import { getUserSettings } from '@zextras/carbonio-shell-ui';
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
import { NormalizedConversation } from 'types/conversations';
import { IncompleteMessage, MailMessage } from 'types/messages';
import { SearchRequestStatus } from 'types/search';

type ConversationWithStatus = {
	conversation: NormalizedConversation;
	conversationStatus: SearchRequestStatus;
};

type UseCompleteConversationOrFetchParams = {
	conversationId: string;
	folderId?: string;
	shouldMarkAsRead?: boolean;
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
	folderId,
	shouldMarkAsRead = false
}: UseCompleteConversationOrFetchParams): ConversationWithStatus {
	const conversation = useConversationById(conversationId);
	const conversationStatus = useConversationStatus(conversationId);

	const requestDebouncedConversation = useMemo(
		() =>
			debounce(
				() => {
					if (conversation && !conversationStatus) {
						const prefs = getUserSettings()?.prefs;
						const html = prefs?.zimbraPrefMessageViewHtmlPreferred === 'TRUE';
						searchConvEmailStoreAction({ conversationId, folderId, shouldMarkAsRead, html });
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
	shouldMarkAsRead?: boolean;
};

/**
 * Get the message from the store or fetch it.
 * Ensures that incomplete messages are fetched if their status indicates they are not yet fulfilled.
 */
export function useCompleteMessageOrFetch({
	messageId,
	shouldMarkAsRead = false
}: UseCompleteMessageOrFetchParams): MessageWithStatus {
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
						const prefs = getUserSettings()?.prefs;
						const html = prefs?.zimbraPrefMessageViewHtmlPreferred === 'TRUE';
						getMessageEmailStoreAction({ messageId, html, shouldMarkAsRead });
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
