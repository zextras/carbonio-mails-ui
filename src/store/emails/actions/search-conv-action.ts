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
import { NotifiedItems, trackNotifiedItems } from 'store/emails/notified-items';
import {
	updateMessages,
	getConversationById,
	getMessageById,
	updateConversations,
	updateConversationStatus
} from 'store/emails/store';
import { NormalizedConversation } from 'types/conversations';
import { SearchConvResponse } from 'types/soap/search-conv';

const NO_NOTIFIED_ITEMS: NotifiedItems = { deletedIds: new Set(), changedIds: new Set() };

/**
 * The items notified while the search was in progress are newer than its results: the deleted ones are not
 * brought back and the changed ones that are stored keep what was notified.
 */
function handleSearchConvResponse(
	conversationId: string,
	response: SearchConvResponse,
	html: boolean,
	{ deletedIds, changedIds }: NotifiedItems = NO_NOTIFIED_ITEMS
): void {
	if (deletedIds.has(conversationId)) {
		return;
	}
	const searchedMessages = (response?.m ?? []).filter((msg) => !deletedIds.has(msg.id));
	const messages = searchedMessages
		.filter((msg) => !changedIds.has(msg.id) || !getMessageById(msg.id))
		.map((msg) => {
			const message = normalizeCompleteMailMessageFromSoap(msg, html);
			// the messages outside the query (e.g. replies in Sent) come without headers: keep what was known
			const stored = msg._attrs ? undefined : getMessageById(msg.id);
			return stored ? { ...message, ...pick(stored, MAIL_HEADER_FIELDS) } : message;
		});
	updateMessages(messages);
	const conversation = getConversationById(conversationId);
	if (conversation && changedIds.has(conversationId)) {
		return;
	}
	const updatedConversation: NormalizedConversation = {
		...conversation,
		id: conversationId,
		messageIds: map(searchedMessages, (msg) => msg.id)
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
		handleSearchConvResponse(conversationId, response, html, notifiedItems);
	} finally {
		stop();
	}
}
