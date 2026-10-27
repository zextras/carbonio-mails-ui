/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { map, pick } from 'lodash';

import { searchConvSoapApi } from 'api/search-conv-soap-api';
import { API_REQUEST_STATUS } from 'constants/index';
import { normalizeCompleteMailMessageFromSoap } from 'normalizations/normalize-message';
import {
	updateMessages,
	getConversationById,
	getMessageById,
	updateConversations,
	updateConversationStatus
} from 'store/emails/store';
import { NormalizedConversation } from 'types/conversations';
import { SearchConvResponse } from 'types/soap/search-conv';

const HEADER_FIELDS = [
	'messageIsFromExternalDomain',
	'sensitivity',
	'messageIdFromMailHeaders',
	'creationDateFromMailHeaders',
	'messageIsFromDistributionList'
] as const;

function handleSearchConvResponse(
	conversationId: string,
	response: SearchConvResponse,
	html: boolean
): void {
	const messages = map(response?.m ?? [], (msg) => {
		const message = normalizeCompleteMailMessageFromSoap(msg, html);
		// the messages outside the query (e.g. replies in Sent) come without headers: keep what was known
		const stored = msg._attrs ? undefined : getMessageById(msg.id);
		return stored ? { ...message, ...pick(stored, HEADER_FIELDS) } : message;
	});
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

export async function searchConvEmailStoreAction({
	conversationId,
	folderId,
	shouldMarkAsRead,
	html
}: {
	conversationId: string;
	folderId?: string;
	shouldMarkAsRead?: boolean;
	html: boolean;
}): Promise<void> {
	updateConversationStatus(conversationId, API_REQUEST_STATUS.pending);
	const response = await searchConvSoapApi({
		conversationId,
		fetch: 'all',
		folderId,
		shouldMarkAsRead,
		html
	}).catch(() => {
		updateConversationStatus(conversationId, API_REQUEST_STATUS.error);
	});
	if (!response || 'Fault' in response) {
		updateConversationStatus(conversationId, API_REQUEST_STATUS.error);
		return;
	}
	handleSearchConvResponse(conversationId, response, html);
	updateConversationStatus(conversationId, API_REQUEST_STATUS.fulfilled);
}
