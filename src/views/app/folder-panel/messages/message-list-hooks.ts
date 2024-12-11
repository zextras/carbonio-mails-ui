/* eslint-disable no-param-reassign */
/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { useCallback } from 'react';

import { searchSoapApi } from '../../../../api/search';
import { API_REQUEST_STATUS } from '../../../../constants';
import { normalizeMailMessageFromSoap } from '../../../../normalizations/normalize-message';
import {
	appendMessagesToMessagesSlice,
	updateMessagesResultsLoadingStatus
} from '../../../../store/zustand/emails/store';
import { IncompleteMessage, MailMessage, SearchResponse } from '../../../../types';

function handleLoadMoreResults({
	searchResponse,
	offset
}: {
	searchResponse: SearchResponse;
	offset: number;
}): void {
	if (searchResponse.m) {
		const messages: (IncompleteMessage | MailMessage)[] = [];
		searchResponse.m?.forEach((soapMessage) =>
			messages.push(normalizeMailMessageFromSoap(soapMessage, false))
		);
		appendMessagesToMessagesSlice(messages, offset);
	}
}
export function useLoadMoreForMessagesSlice({
	offset,
	sortBy,
	limit,
	hasMore,
	loadingMore,
	types,
	folderId
}: {
	limit: number;
	sortBy: string;
	folderId: string;
	offset: number;
	hasMore?: boolean;
	loadingMore: React.MutableRefObject<boolean>;
	types: 'conversation' | 'message';
}): () => Promise<void> {
	return useCallback(async () => {
		if (hasMore && !loadingMore.current) {
			loadingMore.current = true;
			const searchResponse = await searchSoapApi({
				folderId,
				limit,
				sortBy,
				types,
				offset,
				recip: '0'
			}).finally(() => {
				loadingMore.current = false;
			});
			if ('Fault' in searchResponse) {
				updateMessagesResultsLoadingStatus(API_REQUEST_STATUS.error);
				return;
			}
			handleLoadMoreResults({ searchResponse, offset });
		}
	}, [folderId, hasMore, limit, loadingMore, offset, sortBy, types]);
}
