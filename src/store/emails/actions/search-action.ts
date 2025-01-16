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

import { searchSoapApi } from '../../../api/search-soap-api';
import { API_REQUEST_STATUS } from '../../../constants';
import { normalizeConversations } from '../../../normalizations/normalize-conversation';
import { normalizeMailMessageFromSoap } from '../../../normalizations/normalize-message';
import { SearchResponse, SearchSoapApiParams } from '../../../types';
import {
	updateMessagesResultsLoadingStatus,
	setMessagesInEmailStore,
	setConversationsInEmailStore,
	resetMessagesAndPopulatedItems,
	updateConversationsResultsLoadingStatus
} from '../store';

const handleSearchSoapApiResults = ({
	searchResponse,
	types
}: {
	searchResponse: SearchResponse | ErrorSoapBodyResponse;
	types: string | undefined;
}): void => {
	if ('Fault' in searchResponse) {
		if (types === 'message') {
			updateMessagesResultsLoadingStatus(API_REQUEST_STATUS.error);
			return;
		}
		updateConversationsResultsLoadingStatus(API_REQUEST_STATUS.error);
		return;
	}
	if (searchResponse.m?.length) {
		const normalizedMessages = map(searchResponse.m, (msg) =>
			normalizeMailMessageFromSoap(msg, false)
		);
		setMessagesInEmailStore(normalizedMessages, searchResponse.more);
		return;
	}
	if (searchResponse.c?.length) {
		const conversations = normalizeConversations(searchResponse.c);
		setConversationsInEmailStore(conversations, searchResponse.more);
		return;
	}
	resetMessagesAndPopulatedItems();
	updateMessagesResultsLoadingStatus(API_REQUEST_STATUS.fulfilled);
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
	handleSearchSoapApiResults({ searchResponse, types });
	return searchResponse;
}
