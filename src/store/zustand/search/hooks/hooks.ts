/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { useEffect } from 'react';

import { map } from 'lodash';

import { searchConvSoapAPI } from '../../../../api/search-conv';
import { API_REQUEST_STATUS } from '../../../../constants';
import { normalizeMailMessageFromSoap } from '../../../../normalizations/normalize-message';
import { NormalizedConversation, SearchConvResponse, SearchRequestStatus } from '../../../../types';
import {
	updateConversationMessages,
	updateConversationStatus,
	useConversationById,
	useConversationStatus
} from '../../message-store/store';

function handleSearchConvResponse(conversationId: string, response: SearchConvResponse): void {
	const messages = map(response?.m ?? [], (msg) => normalizeMailMessageFromSoap(msg, true));
	updateConversationMessages(conversationId, messages);
}

type ConversationWithStatus = {
	conversation: NormalizedConversation;
	conversationStatus: SearchRequestStatus;
};

export function retrieveConversation(conversationId: string, folderId: string): void {
	updateConversationStatus(conversationId, API_REQUEST_STATUS.pending);
	searchConvSoapAPI({ conversationId, fetch: 'all', folderId })
		.then((response) => {
			if ('Fault' in response) {
				updateConversationStatus(conversationId, API_REQUEST_STATUS.error);
				return;
			}
			handleSearchConvResponse(conversationId, response);
		})
		.catch(() => {
			updateConversationStatus(conversationId, API_REQUEST_STATUS.error);
		});
}

export function useCompleteConversation(
	conversationId: string,
	folderId: string
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
