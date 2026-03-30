/* eslint-disable no-param-reassign */
/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { useCallback } from 'react';

import { getFilterQuery } from '../../../../helpers/sorting';
import { searchSoapApi } from 'api/search-soap-api';
import { API_REQUEST_STATUS } from 'constants/index';
import { normalizeMailMessageFromSoap } from 'normalizations/normalize-message';
import {
	appendMessagesToMessagesSlice,
	updateMessagesResultsLoadingStatus
} from 'store/emails/store';
import { SearchResponse } from 'types/soap/search';
import { SortBy } from 'types/sorting';

function handleLoadMoreResults({
	searchResponse,
	offset
}: {
	searchResponse: SearchResponse;
	offset: number;
}): void {
	if (searchResponse.m) {
		const messages = searchResponse.m?.map((soapMessage) =>
			normalizeMailMessageFromSoap({ m: soapMessage, isComplete: false, html: true })
		);
		appendMessagesToMessagesSlice(messages, offset, searchResponse.more);
	}
}
export function useLoadMoreForMessageList({
	offset,
	sortBy,
	limit,
	hasMore,
	loadingMore,
	folderId,
	filterType
}: {
	limit: number;
	sortBy: SortBy;
	folderId: string;
	offset: number;
	hasMore?: boolean;
	loadingMore: React.MutableRefObject<boolean>;
	filterType: string | undefined;
}): () => Promise<void> {
	return useCallback(async () => {
		if (hasMore && !loadingMore.current) {
			loadingMore.current = true;
			const searchResponse = await searchSoapApi({
				query: getFilterQuery(filterType, folderId),
				limit,
				sortBy,
				types: 'message',
				offset,
				recip: '0'
			})
				.finally(() => {
					loadingMore.current = false;
				})
				.catch(() => {
					updateMessagesResultsLoadingStatus(API_REQUEST_STATUS.error);
				});
			if (!searchResponse || 'Fault' in searchResponse) {
				updateMessagesResultsLoadingStatus(API_REQUEST_STATUS.error);
				return;
			}
			handleLoadMoreResults({ searchResponse, offset });
		}
	}, [filterType, folderId, hasMore, limit, loadingMore, offset, sortBy]);
}
