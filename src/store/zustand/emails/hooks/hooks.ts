/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { useEffect } from 'react';

import { ErrorSoapBodyResponse } from '@zextras/carbonio-shell-ui';
import { map } from 'lodash';

import { getMsgSoapAPI } from '../../../../api/get-msg';
import { searchConvSoapAPI } from '../../../../api/search-conv';
import { API_REQUEST_STATUS } from '../../../../constants';
import { normalizeConversations } from '../../../../normalizations/normalize-conversation';
import {
	normalizeCompleteMailMessageFromSoap,
	normalizeMailMessageFromSoap
} from '../../../../normalizations/normalize-message';
import {
	GetMsgResponse,
	IncompleteMessage,
	MailMessage,
	NormalizedConversation,
	SearchConvResponse,
	SearchRequestStatus,
	SearchResponse
} from '../../../../types';
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
	setConversationsInEmailStore
} from '../store';

function handleSearchConvResponse(conversationId: string, response: SearchConvResponse): void {
	const messages = map(response?.m ?? [], (msg) => normalizeCompleteMailMessageFromSoap(msg));
	updateMessages(messages);
}

type ConversationWithStatus = {
	conversation: NormalizedConversation;
	conversationStatus: SearchRequestStatus;
};

export function retrieveConversation(conversationId: string, folderId?: string): void {
	updateConversationStatus(conversationId, API_REQUEST_STATUS.pending);
	searchConvSoapAPI({ conversationId, fetch: 'all', folderId })
		.then((response) => {
			if ('Fault' in response) {
				updateConversationStatus(conversationId, API_REQUEST_STATUS.error);
				return;
			}
			handleSearchConvResponse(conversationId, response);
			updateConversationStatus(conversationId, API_REQUEST_STATUS.fulfilled);
		})
		.catch(() => {
			updateConversationStatus(conversationId, API_REQUEST_STATUS.error);
		});
}

export function useCompleteConversation(
	conversationId: string,
	folderId?: string
): ConversationWithStatus {
	const conversation = useConversationById(conversationId);
	const conversationStatus = useConversationStatus(conversationId);
	useEffect(() => {
		if (conversation && !conversationStatus) {
			retrieveConversation(conversationId, folderId);
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
): Promise<void> {
	updateMessageStatus(messageId, API_REQUEST_STATUS.pending);
	return apiCall(messageId)
		.then((response) => {
			if ('Fault' in response) {
				updateMessageStatus(messageId, API_REQUEST_STATUS.error);
				return;
			}
			handleGetMsgResponse(response);
			updateMessageStatus(messageId, API_REQUEST_STATUS.fulfilled);
		})
		.catch(() => {
			updateMessageStatus(messageId, API_REQUEST_STATUS.error);
		});
}

function retrieveMessage(messageId: string): void {
	handleRetrieveMessage(messageId, (id) => getMsgSoapAPI({ msgId: id, max: 250_000 }));
}

export function retrieveFullMessage(messageId: string): Promise<void> {
	return handleRetrieveMessage(messageId, (id) => getMsgSoapAPI({ msgId: id }));
}

export function useCompleteMessage(messageId: string): MessageWithStatus {
	const message = useMessageById(messageId);
	const messageStatus = useMessageStatus(messageId);
	useEffect(() => {
		if (message && !messageStatus) {
			retrieveMessage(messageId);
		}
	}, [message, messageId, messageStatus]);
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
	}
	if (searchResponse.c?.length) {
		const conversations = normalizeConversations(searchResponse.c);

		setConversationsInEmailStore(conversations, searchResponse.more);
	} else {
		resetMessagesAndPopulatedItems();
		updateMessagesResultsLoadingStatus(API_REQUEST_STATUS.fulfilled);
	}
};
