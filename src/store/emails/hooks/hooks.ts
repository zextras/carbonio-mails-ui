/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { useEffect, useMemo } from 'react';

import { getUserSettings } from '@zextras/carbonio-shell-ui';
import { debounce } from 'lodash';

import { API_REQUEST_STATUS, DEFAULT_API_DEBOUNCE_TIME } from 'constants/index';
import { MailboxRefreshedEvent } from 'event-bus/events/mailbox-refreshed';
import { getMessageEmailStoreAction } from 'store/emails/actions/get-message';
import {
	refreshConvEmailStoreAction,
	searchConvEmailStoreAction
} from 'store/emails/actions/search-conv-action';
import { showConversation } from 'store/emails/shown-conversations';
import {
	useConversationById,
	useConversationStatus,
	useMessageById,
	useMessageStatus
} from 'store/emails/store';
import { NormalizedConversation } from 'types/conversations';
import { IncompleteMessage, MailMessage } from 'types/messages';
import { SearchRequestStatus } from 'types/search';

/**
 * Updates a shown conversation in place when the mailbox is refreshed, repeating its search with the
 * same folder it was loaded with. Its messages could have changed while their notifications were
 * dropped (e.g. new, moved or deleted messages). The loaded conversations which are not shown are
 * loaded again when they are shown next (see refreshConversationsInEmailStore).
 */
export function useRefreshConversationOnMailboxRefresh({
	conversationId,
	folderId,
	enabled
}: {
	conversationId: string;
	folderId?: string;
	enabled: boolean;
}): void {
	useEffect(() => {
		if (!enabled) {
			return undefined;
		}
		const hideConversation = showConversation(conversationId);
		const handler = (): void => {
			const html = getUserSettings()?.prefs?.zimbraPrefMessageViewHtmlPreferred === 'TRUE';
			refreshConvEmailStoreAction({ conversationId, folderId, html });
		};

		window.addEventListener(MailboxRefreshedEvent.EventName, handler);
		return () => {
			window.removeEventListener(MailboxRefreshedEvent.EventName, handler);
			hideConversation();
		};
	}, [conversationId, enabled, folderId]);
}

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

	useRefreshConversationOnMailboxRefresh({
		conversationId,
		folderId,
		enabled: conversationStatus === API_REQUEST_STATUS.fulfilled
	});

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
