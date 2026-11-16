/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { useEffect, useMemo } from 'react';

import { getUserSettings } from '@zextras/carbonio-shell-ui';
import { debounce, noop } from 'lodash';

import { API_REQUEST_STATUS, DEFAULT_API_DEBOUNCE_TIME } from 'constants/index';
import { MailboxRefreshedEvent } from 'event-bus/events/mailbox-refreshed';
import { useEventSubscribe } from 'event-bus/use-event-subscribe';
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

// the conversations to search again for the mailbox refresh being handled, with the folders of the views
// which show them (undefined for a view of all its folders): more views can show a conversation at once
const conversationsToRefresh = new Map<string, Set<string | undefined>>();

function refreshConversations(): void {
	const conversations = [...conversationsToRefresh];
	// cleared first, so a failure cannot keep the next refreshes from being scheduled
	conversationsToRefresh.clear();
	const html = getUserSettings()?.prefs?.zimbraPrefMessageViewHtmlPreferred === 'TRUE';
	conversations.forEach(([conversationId, folderIds]) => {
		// the search of a folder leaves the headers out of the messages of the other folders: a conversation
		// shown with different folders, or with all of them, is searched in all its folders
		const folderId = folderIds.size === 1 ? [...folderIds][0] : undefined;
		// a failed refresh leaves the conversation as it is
		refreshConvEmailStoreAction({ conversationId, folderId, html }).catch(noop);
	});
}

/**
 * Updates a shown conversation in place when the mailbox is refreshed, repeating its search with the
 * folder of the view that shows it (none for the reading panel, which shows all its folders). Its messages
 * could have changed while their notifications were dropped (e.g. new, moved or deleted messages).
 * A conversation shown by more views is searched again once, after every view has handled the event,
 * in all its folders unless every view shows the same folder.
 * The loaded conversations which are not shown are loaded again when they are shown next
 * (see clearHiddenConversationsStatus).
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
	const subscribeBusEvent = useEventSubscribe();

	useEffect(() => {
		if (!enabled) {
			return undefined;
		}
		const hideConversation = showConversation(conversationId);
		const unsubscribe = subscribeBusEvent(MailboxRefreshedEvent.EventName, () => {
			// the listeners run one after the other while the event is dispatched: the searches start after it
			if (conversationsToRefresh.size === 0) {
				queueMicrotask(refreshConversations);
			}
			const folderIds = conversationsToRefresh.get(conversationId) ?? new Set<string | undefined>();
			folderIds.add(folderId);
			conversationsToRefresh.set(conversationId, folderIds);
		});
		return () => {
			unsubscribe();
			hideConversation();
		};
	}, [conversationId, enabled, folderId, subscribeBusEvent]);
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
