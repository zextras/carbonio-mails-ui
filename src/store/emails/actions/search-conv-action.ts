/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { map, noop, pick } from 'lodash';

import { searchConvSoapApi } from 'api/search-conv-soap-api';
import { API_REQUEST_STATUS } from 'constants/index';
import {
	MAIL_HEADER_FIELDS,
	normalizeCompleteMailMessageFromSoap
} from 'normalizations/normalize-message';
import { trackNotifiedItems } from 'store/emails/notified-items';
import {
	updateMessages,
	getConversationById,
	getMessageById,
	refreshConversationInEmailStore,
	updateConversations,
	updateConversationStatus
} from 'store/emails/store';
import { NormalizedConversation } from 'types/conversations';
import { MailMessage } from 'types/messages';
import { SearchConvResponse } from 'types/soap/search-conv';

function normalizeSearchConvMessages(
	response: SearchConvResponse,
	html: boolean
): Array<MailMessage> {
	return map(response?.m ?? [], (msg) => {
		const message = normalizeCompleteMailMessageFromSoap(msg, html);
		// the messages outside the query (e.g. replies in Sent) come without headers: keep what was known
		const stored = msg._attrs ? undefined : getMessageById(msg.id);
		return stored ? { ...message, ...pick(stored, MAIL_HEADER_FIELDS) } : message;
	});
}

function handleSearchConvResponse(
	conversationId: string,
	response: SearchConvResponse,
	html: boolean
): void {
	const messages = normalizeSearchConvMessages(response, html);
	updateMessages(messages);
	const conversation = getConversationById(conversationId);
	const updatedConversation: NormalizedConversation = {
		...conversation,
		id: conversationId,
		messageIds: map(messages, (message) => message.id)
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

/**
 * Repeats the search of a shown conversation after a mailbox refresh without changing its status,
 * so it is updated in place instead of being reloaded. A failed search leaves it as it is.
 */
export async function refreshConvEmailStoreAction({
	conversationId,
	folderId,
	html
}: {
	conversationId: string;
	folderId?: string;
	html: boolean;
}): Promise<void> {
	// the notifications are recorded until the results are queued in the store after them
	const { notifiedItems, stop } = trackNotifiedItems();
	try {
		const response = await searchConvSoapApi({
			conversationId,
			fetch: 'all',
			folderId,
			html
		}).catch(noop);
		if (!response || 'Fault' in response) {
			return;
		}
		refreshConversationInEmailStore(
			conversationId,
			normalizeSearchConvMessages(response, html),
			notifiedItems
		);
	} finally {
		stop();
	}
}
