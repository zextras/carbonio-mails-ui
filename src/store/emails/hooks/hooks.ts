/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { useCallback, useEffect } from 'react';

import { ErrorSoapBodyResponse } from '@zextras/carbonio-shell-ui';
import { map } from 'lodash';

import { getMsgSoapApi } from '../../../api/get-msg-soap-api';
import { searchConvSoapApi } from '../../../api/search-conv-soap-api';
import { API_REQUEST_STATUS } from '../../../constants';
import { normalizeConversations } from '../../../normalizations/normalize-conversation';
import {
	normalizeCompleteMailMessageFromSoap,
	normalizeMailMessageFromSoap
} from '../../../normalizations/normalize-message';
import {
	ConvMessage,
	GetMsgResponse,
	IncompleteMessage,
	MailMessage,
	NormalizedConversation,
	SearchConvResponse,
	SearchRequestStatus,
	SearchResponse
} from '../../../types';
import {
	updateMessages,
	updateConversationStatus,
	useConversationById,
	useConversationStatus,
	useMessageById,
	updateMessageStatus,
	useMessageStatus,
	updateMessagesResultsLoadingStatus,
	resetMessagesAndPopulatedItems,
	setMessagesInEmailStore,
	setConversationsInEmailStore,
	getConversationById,
	updateConversations
} from '../store';

function handleSearchConvResponse(conversationId: string, response: SearchConvResponse): void {
	const messages = map(response?.m ?? [], (msg) => normalizeCompleteMailMessageFromSoap(msg));
	updateMessages(messages);
	const convMessages: Array<ConvMessage> = map(response?.m ?? [], (msg) => ({
		id: msg.id,
		parent: msg.l,
		date: msg.d
	}));
	const conversation = getConversationById(conversationId);
	const updatedConversation = { ...conversation, id: conversationId, messages: convMessages };
	updateConversations([updatedConversation]);
}

type ConversationWithStatus = {
	conversation: NormalizedConversation;
	conversationStatus: SearchRequestStatus;
};

export async function fetchConversation(conversationId: string, folderId?: string): Promise<void> {
	updateConversationStatus(conversationId, API_REQUEST_STATUS.pending);
	const response = await searchConvSoapApi({ conversationId, fetch: 'all', folderId }).catch(() => {
		updateConversationStatus(conversationId, API_REQUEST_STATUS.error);
	});
	if (!response) return;
	if ('Fault' in response) {
		updateConversationStatus(conversationId, API_REQUEST_STATUS.error);
		return;
	}
	handleSearchConvResponse(conversationId, response);
	updateConversationStatus(conversationId, API_REQUEST_STATUS.fulfilled);
}

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
			fetchConversation(conversationId, folderId);
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

function handleGetMsgResponse(response: GetMsgResponse): void {
	const messages = map(response?.m ?? [], (msg) => normalizeCompleteMailMessageFromSoap(msg));
	updateMessages(messages);
}
async function handleRetrieveMessage(
	messageId: string,
	apiCall: (id: string) => Promise<GetMsgResponse>
): Promise<MailMessage | undefined> {
	updateMessageStatus(messageId, API_REQUEST_STATUS.pending);
	const response = await apiCall(messageId).catch(() => {
		updateMessageStatus(messageId, API_REQUEST_STATUS.error);
	});
	if (!response) return undefined;
	if ('Fault' in response) {
		updateMessageStatus(messageId, API_REQUEST_STATUS.error);
		return undefined;
	}
	handleGetMsgResponse(response);
	updateMessageStatus(messageId, API_REQUEST_STATUS.fulfilled);
	return normalizeMailMessageFromSoap(response.m[0], true) as MailMessage;
}

export function getMessageAction(messageId: string): Promise<MailMessage | undefined> {
	return handleRetrieveMessage(messageId, (id) => getMsgSoapApi({ msgId: id, max: 250_000 }));
}

export function getFullMessageAction(messageId: string): Promise<MailMessage | undefined> {
	return handleRetrieveMessage(messageId, (id) => getMsgSoapApi({ msgId: id }));
}

/**
 * Get the message from the store or fetch it.
 * Ensures that incomplete messages are fetched if their status indicates they are not yet fulfilled.
 */
export function useCompleteMessageOrFetch(messageId: string): MessageWithStatus {
	const message = useMessageById(messageId);
	const messageStatus = useMessageStatus(messageId);

	const retrieveMessageCallback = useCallback(() => {
		getMessageAction(messageId);
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
