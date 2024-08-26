/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { useEffect } from 'react';

import { map } from 'lodash';

import { getMsgSoapAPI } from '../../../../api/get-msg';
import { searchConvSoapAPI } from '../../../../api/search-conv';
import { API_REQUEST_STATUS } from '../../../../constants';
import { normalizeCompleteMailMessageFromSoap } from '../../../../normalizations/normalize-message';
import {
	GetMsgResponse,
	IncompleteMessage,
	MailMessage,
	NormalizedConversation,
	SearchConvResponse,
	SearchRequestStatus
} from '../../../../types';
import {
	updateMessages,
	updateConversationStatus,
	useConversationById,
	useConversationStatus,
	useMessageById,
	updateMessageStatus,
	useMessageStatus
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

function retrieveMessage(messageId: string): void {
	updateMessageStatus(messageId, API_REQUEST_STATUS.pending);
	getMsgSoapAPI({ msgId: messageId })
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
