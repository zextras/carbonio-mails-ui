/* eslint-disable no-param-reassign */
/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useCallback, useMemo, useState } from 'react';

import { useSnackbar } from '@zextras/carbonio-design-system';
import type { QueryChip } from '@zextras/carbonio-search-ui';
import { type ErrorSoapBodyResponse, t, useUserSettings } from '@zextras/carbonio-shell-ui';
import { getTags, Tags, useFoldersMap } from '@zextras/carbonio-ui-commons';
import { map } from 'lodash';

import { searchSoapApi } from 'api/search-soap-api';
import { API_REQUEST_STATUS, LIST_LIMIT, TIMEOUTS } from 'constants/index';
import { mapToNormalizedConversation } from 'normalizations/normalize-conversation';
import { normalizeMailMessageFromSoap } from 'normalizations/normalize-message';
import {
	appendConversations,
	appendMessagesToSearch,
	resetSearchAndPopulatedItems,
	setMessagesInEmailStore,
	setSearchResultsByConversation,
	setSearchResultsByMessage,
	updateSearchResultsLoadingStatus,
	useSearchResults
} from 'store/emails/store';
import { IncompleteMessage, MailMessage } from 'types/messages';
import { SearchIndexSliceState } from 'types/search';
import { SearchResponse } from 'types/soap/search';
import { generateQueryString, updateQueryChips } from 'views/search/utils';
import { extractConvMessage } from 'views/sidebar/commons/use-sync-data-handler';

type UseRunSearchProps = {
	query: QueryChip[];
	// eslint-disable-next-line @typescript-eslint/ban-types
	updateQuery: Function;
	isSharedFolderIncluded: boolean;
};

function handleFulFilledConversationResults({
	searchResponse
}: {
	searchResponse: SearchResponse;
}): void {
	const conversations = map(searchResponse.c, (conv) =>
		mapToNormalizedConversation({ conversation: conv })
	);

	setSearchResultsByConversation(conversations, searchResponse.more);
}

function handleFulFilledMessagesResults({
	searchResponse
}: {
	searchResponse: SearchResponse;
}): void {
	const normalizedMessages = map(searchResponse.m, (msg) =>
		normalizeMailMessageFromSoap({ m: msg, isComplete: false, html: true })
	);

	setSearchResultsByMessage(normalizedMessages, searchResponse.more);
}

function handleLoadMoreResults({
	searchResponse,
	offset
}: {
	searchResponse: SearchResponse;
	offset: number;
	tags: Tags;
}): void {
	if (searchResponse.c) {
		const conversations = map(searchResponse.c, (conv) =>
			mapToNormalizedConversation({ conversation: conv })
		);
		const messages = extractConvMessage(searchResponse.c);
		appendConversations(conversations, offset, searchResponse.more);
		appendMessagesToSearch(messages, offset);
	}
	if (searchResponse.m) {
		const messages: (IncompleteMessage | MailMessage)[] = [];
		searchResponse.m?.forEach((soapMessage) =>
			messages.push(normalizeMailMessageFromSoap({ m: soapMessage, isComplete: false, html: true }))
		);
		appendMessagesToSearch(messages, offset);
	}
}

export function handleSearchResults({
	searchResponse
}: {
	searchResponse: SearchResponse | ErrorSoapBodyResponse;
}): void {
	if ('Fault' in searchResponse) {
		return;
	}
	if (searchResponse.c) {
		handleFulFilledConversationResults({ searchResponse });
		const messages = extractConvMessage(searchResponse.c);
		setMessagesInEmailStore(messages);
	}

	if (searchResponse.m) {
		handleFulFilledMessagesResults({ searchResponse });
	}
	if (searchResponse && !searchResponse.c && !searchResponse.m) {
		resetSearchAndPopulatedItems();
		updateSearchResultsLoadingStatus(API_REQUEST_STATUS.fulfilled);
	}
}

export function useIsMessageView(): boolean {
	const settings = useUserSettings();
	return settings.prefs.zimbraPrefGroupMailBy === 'message';
}

type UseRunSearchReturnType = {
	queryToString: string;
	searchResults: SearchIndexSliceState['searchIndexSlice'];
	isInvalidQuery: boolean;
	executeSearch: (abortSignal: AbortSignal) => Promise<void>;
};

export function useRunSearch({
	query,
	updateQuery,
	isSharedFolderIncluded
}: UseRunSearchProps): UseRunSearchReturnType {
	const settings = useUserSettings();
	const isMessageView = useIsMessageView();
	const folders = useFoldersMap();
	const createSnackbar = useSnackbar();
	const [isInvalidQuery, setIsInvalidQuery] = useState<boolean>(false);

	const searchResults = useSearchResults();

	const queryToString = useMemo(
		() => generateQueryString(query, isSharedFolderIncluded, folders),
		[query, isSharedFolderIncluded, folders]
	);
	const prefLocale = useMemo(
		() => settings.prefs.zimbraPrefLocale,
		[settings.prefs.zimbraPrefLocale]
	);
	updateQueryChips(query, isInvalidQuery, updateQuery);

	const executeSearch = useCallback(
		async (abortSignal: AbortSignal) => {
			updateSearchResultsLoadingStatus(API_REQUEST_STATUS.pending);
			const searchResponse = await searchSoapApi({
				query: queryToString,
				limit: LIST_LIMIT.INITIAL_LIMIT,
				sortBy: 'dateDesc',
				types: isMessageView ? 'message' : 'conversation',
				offset: 0,
				locale: prefLocale,
				abortSignal
			}).catch(() => undefined);
			if (abortSignal.aborted) {
				// a newer search replaced this one, or the search view was closed
				return;
			}
			if (!searchResponse || 'Fault' in searchResponse) {
				const isQueryParseError =
					searchResponse?.Fault?.Detail?.Error?.Code === 'mail.QUERY_PARSE_ERROR';
				setIsInvalidQuery(isQueryParseError);
				// the results of the previous search can refer to items that are no longer in the store
				resetSearchAndPopulatedItems();
				updateSearchResultsLoadingStatus(API_REQUEST_STATUS.error);
				createSnackbar({
					key: 'search-error',
					replace: true,
					severity: 'error',
					label: isQueryParseError
						? t(
								'messages.snackbar.search_invalid_query',
								'Unable to run the search, edit the keywords and try again'
							)
						: t(
								'label.error_try_again_search',
								'Something went wrong with your search, please try again'
							),
					autoHideTimeout: TIMEOUTS.SEARCH_ERROR,
					hideButton: true
				});
				return;
			}
			setIsInvalidQuery(false);
			handleSearchResults({ searchResponse });
		},
		[createSnackbar, isMessageView, prefLocale, queryToString]
	);

	return {
		searchResults,
		isInvalidQuery,
		queryToString,
		executeSearch
	};
}

export function useLoadMoreForSearchSlice({
	query,
	offset,
	hasMore,
	loadingMore,
	types
}: {
	query: string;
	offset: number;
	hasMore?: boolean;
	loadingMore: React.MutableRefObject<boolean>;
	types: 'conversation' | 'message';
}): () => Promise<void> {
	return useCallback(async () => {
		if (hasMore && !loadingMore.current) {
			loadingMore.current = true;
			const searchResponse = await searchSoapApi({
				query,
				limit: LIST_LIMIT.LOAD_MORE_LIMIT,
				sortBy: 'dateDesc',
				types,
				offset
			}).finally(() => {
				loadingMore.current = false;
			});
			if ('Fault' in searchResponse) {
				updateSearchResultsLoadingStatus(API_REQUEST_STATUS.error);
				return;
			}
			const tags = getTags();
			handleLoadMoreResults({ searchResponse, offset, tags });
		}
	}, [hasMore, loadingMore, offset, query, types]);
}
