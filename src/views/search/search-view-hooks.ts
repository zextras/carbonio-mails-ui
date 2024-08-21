/* eslint-disable no-param-reassign */
/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
	type QueryChip,
	type ErrorSoapBodyResponse,
	getTags,
	type Tags,
	useUserSettings
} from '@zextras/carbonio-shell-ui';
import { map, noop } from 'lodash';

import { generateQueryString, updateQueryChips } from './utils';
import { searchSoapApi } from '../../api/search';
import { useFoldersMap } from '../../carbonio-ui-commons/store/zustand/folder';
import { API_REQUEST_STATUS, LIST_LIMIT } from '../../constants';
import { mapToNormalizedConversation } from '../../normalizations/normalize-conversation';
import { normalizeMailMessageFromSoap } from '../../normalizations/normalize-message';
import {
	appendConversations,
	appendMessages,
	setSearchResultsByConversation,
	setMessages,
	updateSearchResultsLoadingStatus,
	useSearchResults,
	resetSearch
} from '../../store/zustand/message-store/store';
import { IncompleteMessage, MailMessage, SearchResponse, SearchSliceState } from '../../types';

type UseRunSearchProps = {
	query: QueryChip[];
	// eslint-disable-next-line @typescript-eslint/ban-types
	updateQuery: Function;
	// eslint-disable-next-line @typescript-eslint/ban-types
	useDisableSearch: () => [boolean, Function];
	invalidQueryTooltip: string;
	isSharedFolderIncluded: boolean;
};

function handleFulFilledConversationResults({
	searchResponse,
	tags
}: {
	searchResponse: SearchResponse;
	tags: Tags;
}): void {
	const conversations = map(searchResponse.c, (conv) =>
		mapToNormalizedConversation({ c: conv, tags })
	);

	setSearchResultsByConversation(conversations, searchResponse.more);
}

function handleLoadMoreConversationResults({
	searchResponse,
	offset,
	tags
}: {
	searchResponse: SearchResponse;
	offset: number;
	tags: Tags;
}): void {
	const conversations = map(searchResponse.c, (conv) =>
		mapToNormalizedConversation({ c: conv, tags })
	);
	const messages: (IncompleteMessage | MailMessage)[] = [];
	searchResponse.c?.forEach((soapConversation) =>
		soapConversation.m.forEach((soapMessage) =>
			messages.push(normalizeMailMessageFromSoap(soapMessage, false))
		)
	);
	appendConversations(conversations, offset, searchResponse.more);
	appendMessages(messages, offset);
}

function handleFulFilledMessagesResults({
	searchResponse
}: {
	searchResponse: SearchResponse;
}): void {
	const normalizedMessages = map(searchResponse.m, (msg) =>
		normalizeMailMessageFromSoap(msg, false)
	);

	setMessages(normalizedMessages);
}

export function handleSearchResults({
	searchResponse
}: {
	searchResponse: SearchResponse | ErrorSoapBodyResponse;
}): void {
	if ('Fault' in searchResponse) {
		return;
	}
	const tags = getTags();
	if (searchResponse.c) {
		handleFulFilledConversationResults({ searchResponse, tags });
	}

	if (searchResponse.m) {
		handleFulFilledMessagesResults({ searchResponse });
	}
	if (searchResponse && !searchResponse.c && !searchResponse.m) {
		resetSearch();
		updateSearchResultsLoadingStatus(API_REQUEST_STATUS.fulfilled);
	}
}

export function useIsMessageView(): boolean {
	const settings = useUserSettings();
	return settings.prefs.zimbraPrefGroupMailBy === 'message';
}

export function useRunSearch({
	query,
	updateQuery,
	useDisableSearch,
	invalidQueryTooltip,
	isSharedFolderIncluded
}: UseRunSearchProps): {
	searchDisabled: boolean;
	queryToString: string;
	searchResults: SearchSliceState['search'];
	isInvalidQuery: boolean;
	filterCount: number;
} {
	const [searchDisabled, setSearchDisabled] = useDisableSearch();
	const settings = useUserSettings();
	const isMessageView = useIsMessageView();
	const folders = useFoldersMap();
	const [filterCount, setFilterCount] = useState(0);
	const [isInvalidQuery, setIsInvalidQuery] = useState<boolean>(false);
	const initialQueryToString = generateQueryString([], true, folders);
	const previousQuery = useRef(initialQueryToString);

	updateQueryChips(query, isInvalidQuery, updateQuery);

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

	const firstSearchQueryCallback = useCallback(
		async (queryString: string, abortSignal) => {
			updateSearchResultsLoadingStatus(API_REQUEST_STATUS.pending);
			const searchResponse = await searchSoapApi({
				query: queryString,
				limit: LIST_LIMIT.INITIAL_LIMIT,
				sortBy: 'dateDesc',
				types: isMessageView ? 'message' : 'conversation',
				offset: 0,
				recip: '0',
				locale: prefLocale,
				abortSignal
			});
			if (
				'Fault' in searchResponse &&
				searchResponse?.Fault?.Detail?.Error?.Code === 'mail.QUERY_PARSE_ERROR'
			) {
				setIsInvalidQuery(true);
				setSearchDisabled(true, invalidQueryTooltip);
				updateSearchResultsLoadingStatus(API_REQUEST_STATUS.error);
			} else {
				setIsInvalidQuery(false);
				handleSearchResults({ searchResponse });
			}
		},
		[invalidQueryTooltip, isMessageView, prefLocale, setSearchDisabled]
	);

	useEffect(() => {
		const controller = new AbortController();
		const { signal } = controller;
		if (previousQuery.current !== queryToString && query.length > 0) {
			firstSearchQueryCallback(queryToString, signal);
			setFilterCount(query.length);
			previousQuery.current = queryToString;
		}
		return () => {
			controller.abort();
			previousQuery.current = initialQueryToString;
		};
	}, [firstSearchQueryCallback, initialQueryToString, query.length, queryToString]);

	return {
		searchDisabled,
		filterCount,
		searchResults,
		isInvalidQuery,
		queryToString
	};
}

export function useLoadMoreConversations({
	query,
	offset,
	hasMore,
	loadingMore
}: {
	query: string;
	offset: number;
	hasMore?: boolean;
	loadingMore: React.MutableRefObject<boolean>;
}): () => void {
	return useCallback(async () => {
		if (hasMore && !loadingMore.current) {
			loadingMore.current = true;
			const searchResponse = await searchSoapApi({
				query,
				limit: LIST_LIMIT.LOAD_MORE_LIMIT,
				sortBy: 'dateDesc',
				types: 'conversation',
				offset,
				recip: '0'
			}).finally(() => {
				loadingMore.current = false;
			});
			if ('Fault' in searchResponse) {
				// TODO: handle error
				noop();
			} else if (searchResponse.c) {
				const tags = getTags();
				handleLoadMoreConversationResults({ searchResponse, offset, tags });
			}
		}
	}, [hasMore, loadingMore, offset, query]);
}
