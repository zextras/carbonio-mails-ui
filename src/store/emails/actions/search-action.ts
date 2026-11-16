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
import { API_REQUEST_STATUS, LIST_LIMIT } from 'constants/index';
import { normalizeConversations } from 'normalizations/normalize-conversation';
import { normalizeMailMessageFromSoap } from 'normalizations/normalize-message';
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
 * The pages loaded by scrolling (`searchedListIndex` is the list when the search starts) are searched
 * again too. A failed search leaves the list as it is.
 */
export async function refreshSearchEmailStoreAction({
	searchedListIndex,
	types,
	sortBy,
	query,
	locale,
	abortSignal
}: Omit<SearchSoapApiParams, 'offset' | 'limit'> & {
	searchedListIndex: Array<string>;
}): Promise<void> {
	const searchResponse = await searchSoapApi({
		limit: Math.max(LIST_LIMIT.INITIAL_LIMIT, searchedListIndex.length),
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
		const messages = (searchResponse.m ?? []).map((msg) =>
			normalizeMailMessageFromSoap({ m: msg, isComplete: false, html: true })
		);
		refreshMessagesInEmailStore(messages, !!searchResponse.more, searchedListIndex);
		return;
	}

	const conversationHits = searchResponse.c ?? [];
	refreshConversationsInEmailStore(
		normalizeConversations(conversationHits),
		extractConvMessage(conversationHits),
		!!searchResponse.more,
		searchedListIndex
	);
}
