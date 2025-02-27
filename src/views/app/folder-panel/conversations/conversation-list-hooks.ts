/* eslint-disable no-param-reassign */
/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { useCallback } from 'react';

import { searchSoapApi } from '../../../../api/search-soap-api';
import { API_REQUEST_STATUS } from '../../../../constants';
import { normalizeConversations } from '../../../../normalizations/normalize-conversation';
import {
	appendConversationsToConversationIndexSlice,
	updateConversationsResultsLoadingStatus,
	updateMessages
} from '../../../../store/emails/store';
import { SearchResponse } from '../../../../types';
import { extractConvMessage } from '../../../sidebar/commons/use-sync-data-handler';

function handleLoadMoreResults({
	searchResponse,
	offset
}: {
	searchResponse: SearchResponse;
	offset: number;
}): void {
	if (searchResponse.c && searchResponse.c.length > 0) {
		const normalizedConversations = normalizeConversations(searchResponse.c);
		const messages = extractConvMessage(searchResponse.c);
		if (messages.length > 0) updateMessages(messages);
		appendConversationsToConversationIndexSlice(
			normalizedConversations,
			offset,
			searchResponse.more
		);
	}
}
export function useLoadMoreForConversationList({
	offset,
	sortBy,
	limit,
	hasMore,
	loadingMore,
	folderId
}: {
	limit: number;
	sortBy: string;
	folderId: string;
	offset: number;
	hasMore?: boolean;
	loadingMore: React.MutableRefObject<boolean>;
}): () => Promise<void> {
	return useCallback(async () => {
		if (hasMore && !loadingMore.current) {
			loadingMore.current = true;
			const searchResponse = await searchSoapApi({
				folderId,
				limit,
				sortBy,
				types: 'conversation',
				offset,
				recip: '0'
			})
				.catch(() => {
					updateConversationsResultsLoadingStatus(API_REQUEST_STATUS.error);
				})
				.finally(() => {
					loadingMore.current = false;
				});
			if (!searchResponse || 'Fault' in searchResponse) {
				updateConversationsResultsLoadingStatus(API_REQUEST_STATUS.error);
				return;
			}
			handleLoadMoreResults({ searchResponse, offset });
		}
	}, [folderId, hasMore, limit, loadingMore, offset, sortBy]);
}
