/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { map } from 'lodash';

import { searchConvSoapApi } from 'api/search-conv-soap-api';
import { API_REQUEST_STATUS } from 'constants/index';
import { normalizeCompleteMailMessageFromSoap } from 'normalizations/normalize-message';
import {
	updateMessages,
	getConversationById,
	updateConversations,
	updateConversationStatus
} from 'store/emails/store';
import { NormalizedConversation, SearchConvResponse } from 'types/index.d';

function handleSearchConvResponse(conversationId: string, response: SearchConvResponse): void {
	const messages = map(response?.m ?? [], (msg) => normalizeCompleteMailMessageFromSoap(msg));
	updateMessages(messages);
	const convMessagesIds: Array<string> = map(response?.m ?? [], (msg) => msg.id);
	const conversation = getConversationById(conversationId);
	const updatedConversation: NormalizedConversation = {
		...conversation,
		id: conversationId,
		messageIds: convMessagesIds
	};
	updateConversations([updatedConversation]);
}

export async function searchConvEmailStoreAction(
	conversationId: string,
	folderId?: string,
	shouldMarkAsRead?: boolean
): Promise<void> {
	updateConversationStatus(conversationId, API_REQUEST_STATUS.pending);
	const response = await searchConvSoapApi({
		conversationId,
		fetch: 'all',
		folderId,
		shouldMarkAsRead
	}).catch(() => {
		updateConversationStatus(conversationId, API_REQUEST_STATUS.error);
	});
	if (!response || 'Fault' in response) {
		updateConversationStatus(conversationId, API_REQUEST_STATUS.error);
		return;
	}
	handleSearchConvResponse(conversationId, response);
	updateConversationStatus(conversationId, API_REQUEST_STATUS.fulfilled);
}
