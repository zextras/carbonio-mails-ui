/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ErrorSoapBodyResponse } from '@zextras/carbonio-shell-ui';
import { map } from 'lodash';

import { searchSoapApi } from 'api/search-soap-api';
import { API_REQUEST_STATUS } from 'constants/index';
import { normalizeConversations } from 'normalizations/normalize-conversation';
import { getSearchItemFlags, normalizeMailMessageFromSoap } from 'normalizations/normalize-message';
import { trackNotifiedItems } from 'store/emails/notified-items';
import {
	updateMessagesResultsLoadingStatus,
	setMessagesInEmailStore,
	setConversationsInEmailStore,
	resetMessagesAndPopulatedItems,
	updateConversationsResultsLoadingStatus,
	refreshMessagesInEmailStore,
	refreshConversationsInEmailStore
} from 'store/emails/store';
import { SearchSoapApiParams } from 'types/conversations';
import { SearchResponse } from 'types/soap/search';
import { extractConvMessage } from 'views/sidebar/commons/use-sync-data-handler';

const handleSearchSoapApiResults = ({
	searchResponse,
	types
}: {
	searchResponse: SearchResponse | ErrorSoapBodyResponse;
	types: string | undefined;
}): void => {
	// Handle error
	if ('Fault' in searchResponse) {
		if (types === 'message') {
			updateMessagesResultsLoadingStatus(API_REQUEST_STATUS.error);
		} else {
			updateConversationsResultsLoadingStatus(API_REQUEST_STATUS.error);
		}
		return;
	}

	// Handle messages
	if (Array.isArray(searchResponse.m) && searchResponse.m.length > 0) {
		const normalizedMessages = map(searchResponse.m, (msg) =>
			normalizeMailMessageFromSoap({ m: msg, isComplete: false, html: true })
		);
		setMessagesInEmailStore(normalizedMessages, searchResponse.more);
		updateMessagesResultsLoadingStatus(API_REQUEST_STATUS.fulfilled);
		return;
	}

	// Handle conversations
	if (Array.isArray(searchResponse.c) && searchResponse.c.length > 0) {
		const conversations = normalizeConversations(searchResponse.c);
		const messages = extractConvMessage(searchResponse.c);
		if (messages.length > 0) setMessagesInEmailStore(messages);
		setConversationsInEmailStore(conversations, searchResponse.more);
		updateConversationsResultsLoadingStatus(API_REQUEST_STATUS.fulfilled);
	}
};

export async function searchEmailStoreAction({
	limit,
	types,
	sortBy,
	query,
	offset,
	locale,
	abortSignal
}: SearchSoapApiParams): ReturnType<typeof searchSoapApi> {
	const searchResponse = await searchSoapApi({
		limit,
		types,
		sortBy,
		query,
		offset,
		locale,
		abortSignal
	});
	// the results of an aborted search (replaced by another one) are never applied
	if (abortSignal?.aborted) {
		return searchResponse;
	}
	// Reset state before handling new results
	resetMessagesAndPopulatedItems();

	handleSearchSoapApiResults({ searchResponse, types });
	return searchResponse;
}

/**
 * Repeats the search of the open list without resetting the store: the list is replaced while
 * the populated items are merged, so the open message or conversation is not reloaded.
 * `limit` covers the pages loaded by scrolling too, and `searchedListIndex` is the list when the search
 * starts. The items notified meanwhile keep what was notified. A failed search leaves the list as it is.
 */
export async function refreshSearchEmailStoreAction({
	searchedListIndex,
	limit,
	types,
	sortBy,
	query,
	locale,
	abortSignal
}: Omit<SearchSoapApiParams, 'offset'> & {
	searchedListIndex: Array<string>;
}): Promise<void> {
	// the notifications are recorded until the results are queued in the store after them
	const { notifiedItems, stop } = trackNotifiedItems();
	try {
		const searchResponse = await searchSoapApi({
			limit,
			types,
			sortBy,
			query,
			offset: 0,
			locale,
			abortSignal
		});
		// an aborted search rejects already, the check makes it explicit that its results are never applied
		if (abortSignal?.aborted || 'Fault' in searchResponse) {
			return;
		}

		if (types === 'message') {
			// the flags and the tags an item has not are set, to overwrite the stored ones
			const messages = (searchResponse.m ?? []).map((msg) => {
				const message = normalizeMailMessageFromSoap({ m: msg, isComplete: false, html: true });
				return { ...message, ...getSearchItemFlags(msg.f), tags: message.tags ?? [] };
			});
			refreshMessagesInEmailStore(
				messages,
				!!searchResponse.more,
				searchedListIndex,
				notifiedItems
			);
			return;
		}

		const conversationHits = searchResponse.c ?? [];
		// the messages of a conversation item carry their flags, but not their tags
		const conversationMessages = extractConvMessage(conversationHits).map((message) => ({
			...message,
			...getSearchItemFlags(message.rawFlags)
		}));
		refreshConversationsInEmailStore(
			normalizeConversations(conversationHits),
			conversationMessages,
			!!searchResponse.more,
			searchedListIndex,
			notifiedItems
		);
	} finally {
		stop();
	}
}
