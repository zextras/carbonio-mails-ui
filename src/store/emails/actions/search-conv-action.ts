/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { map } from 'lodash';

import { searchConvSoapApi } from '../../../api/search-conv-soap-api';
import { API_REQUEST_STATUS } from '../../../constants';
import { normalizeCompleteMailMessageFromSoap } from '../../../normalizations/normalize-message';
import { SearchConvResponse, ConvMessage } from '../../../types';
import {
	updateMessages,
	getConversationById,
	updateConversations,
	updateConversationStatus
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

export async function searchConvEmailStoreAction(
	conversationId: string,
	folderId?: string
): Promise<void> {
	updateConversationStatus(conversationId, API_REQUEST_STATUS.pending);
	const response = await searchConvSoapApi({ conversationId, fetch: 'all', folderId }).catch(() => {
		updateConversationStatus(conversationId, API_REQUEST_STATUS.error);
	});
	if (!response || 'Fault' in response) {
		updateConversationStatus(conversationId, API_REQUEST_STATUS.error);
		return;
	}
	handleSearchConvResponse(conversationId, response);
	updateConversationStatus(conversationId, API_REQUEST_STATUS.fulfilled);
}
