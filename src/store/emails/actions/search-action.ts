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
import { normalizeMailMessageFromSoap } from 'normalizations/normalize-message';
import {
	updateMessagesResultsLoadingStatus,
	setMessagesInEmailStore,
	setConversationsInEmailStore,
	resetMessagesAndPopulatedItems,
	updateConversationsResultsLoadingStatus
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
	folderId,
	limit,
	before,
	types,
	sortBy,
	query,
	offset,
	wantContent,
	locale,
	abortSignal
}: SearchSoapApiParams): ReturnType<typeof searchSoapApi> {
	const searchResponse = await searchSoapApi({
		folderId,
		limit,
		before,
		types,
		sortBy,
		query,
		offset,
		wantContent,
		locale,
		abortSignal
	});
	// Reset state before handling new results
	resetMessagesAndPopulatedItems();

	handleSearchSoapApiResults({ searchResponse, types });
	return searchResponse;
}
