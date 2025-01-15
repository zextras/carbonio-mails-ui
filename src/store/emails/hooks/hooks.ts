/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { useCallback, useEffect } from 'react';

import { ErrorSoapBodyResponse } from '@zextras/carbonio-shell-ui';
import { map } from 'lodash';

import { API_REQUEST_STATUS } from '../../../constants';
import { normalizeConversations } from '../../../normalizations/normalize-conversation';
import { normalizeMailMessageFromSoap } from '../../../normalizations/normalize-message';
import {
	IncompleteMessage,
	MailMessage,
	NormalizedConversation,
	SearchRequestStatus,
	SearchResponse
} from '../../../types';
import { getMessageEmailStoreAction } from '../actions/get-message';
import { searchConvEmailStoreAction } from '../actions/search-conv-action';
import {
	useConversationById,
	useConversationStatus,
	useMessageById,
	useMessageStatus,
	updateMessagesResultsLoadingStatus,
	resetMessagesAndPopulatedItems,
	setMessagesInEmailStore,
	setConversationsInEmailStore
} from '../store';

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
	useEffect(() => {
		if (conversation && !conversationStatus) {
			searchConvEmailStoreAction(conversationId, folderId);
		}
	}, [conversation, conversationId, conversationStatus, folderId]);
	return {
		conversation,
		conversationStatus
	};
}

type MessageWithStatus = {
	message: MailMessage | IncompleteMessage;
	messageStatus: SearchRequestStatus;
};

/**
 * Get the message from the store or fetch it.
 * Ensures that incomplete messages are fetched if their status indicates they are not yet fulfilled.
 */
export function useCompleteMessageOrFetch(messageId: string): MessageWithStatus {
	const message = useMessageById(messageId);
	const messageStatus = useMessageStatus(messageId);

	const retrieveMessageCallback = useCallback(() => {
		getMessageEmailStoreAction(messageId);
	}, [messageId]);

	useEffect(() => {
		if (messageStatus === API_REQUEST_STATUS.pending) return;
		if (!message?.isComplete && messageStatus !== API_REQUEST_STATUS.fulfilled) {
			retrieveMessageCallback();
		}
	}, [message, messageId, messageStatus, retrieveMessageCallback]);

	return {
		message,
		messageStatus
	};
}

export const handleSearchSoapApiResults = ({
	searchResponse
}: {
	searchResponse: SearchResponse | ErrorSoapBodyResponse;
}): void => {
	if ('Fault' in searchResponse) {
		updateMessagesResultsLoadingStatus(API_REQUEST_STATUS.error);
		return;
	}
	if (searchResponse.m?.length) {
		const normalizedMessages = map(searchResponse.m, (msg) =>
			normalizeMailMessageFromSoap(msg, false)
		);
		setMessagesInEmailStore(normalizedMessages, searchResponse.more);
		return;
	}
	if (searchResponse.c?.length) {
		const conversations = normalizeConversations(searchResponse.c);
		setConversationsInEmailStore(conversations, searchResponse.more);
		return;
	}
	resetMessagesAndPopulatedItems();
	updateMessagesResultsLoadingStatus(API_REQUEST_STATUS.fulfilled);
};
