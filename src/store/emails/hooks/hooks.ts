/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { useCallback, useEffect } from 'react';

import { API_REQUEST_STATUS } from '../../../constants';
import {
	IncompleteMessage,
	MailMessage,
	NormalizedConversation,
	SearchRequestStatus
} from '../../../types';
import { getMessageEmailStoreAction } from '../actions/get-message';
import { searchConvEmailStoreAction } from '../actions/search-conv-action';
import {
	useConversationById,
	useConversationStatus,
	useMessageById,
	useMessageStatus
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

	const retrieveMessage = useCallback(() => {
		getMessageEmailStoreAction(messageId);
	}, [messageId]);

	useEffect(() => {
		if (
			messageStatus !== API_REQUEST_STATUS.pending &&
			(!message?.isComplete || messageStatus === undefined)
		) {
			retrieveMessage();
		}
	}, [message, messageId, messageStatus, retrieveMessage]);

	return {
		message,
		messageStatus
	};
}
