/* eslint-disable no-param-reassign */
/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useCallback, useMemo, useState } from 'react';

import type { QueryChip } from '@zextras/carbonio-search-ui';
import { type ErrorSoapBodyResponse, useUserSettings } from '@zextras/carbonio-shell-ui';
import { map } from 'lodash';

import { generateQueryString, updateQueryChips } from './utils';
import { searchSoapApi } from '../../api/search-soap-api';
import { useFoldersMap } from '../../carbonio-ui-commons/store/zustand/folder';
import { getTags } from '../../carbonio-ui-commons/store/zustand/tags';
import { Tags } from '../../carbonio-ui-commons/types/tags';
import { API_REQUEST_STATUS, LIST_LIMIT } from '../../constants';
import { mapToNormalizedConversation } from '../../normalizations/normalize-conversation';
import { normalizeMailMessageFromSoap } from '../../normalizations/normalize-message';
import {
	appendConversations,
	appendMessagesToSearch,
	updateSearchResultsLoadingStatus,
	useSearchResults,
	setSearchResultsByMessage,
	setSearchResultsByConversation,
	resetSearchAndPopulatedItems,
	setMessagesInEmailStore
} from '../../store/emails/store';
import { IncompleteMessage, MailMessage, SearchResponse, SearchIndexSliceState } from '../../types';
import { extractConvMessage } from '../sidebar/commons/use-sync-data-handler';

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
		normalizeMailMessageFromSoap(msg, false)
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
		const messages: (IncompleteMessage | MailMessage)[] = [];
		searchResponse.c?.forEach((soapConversation) =>
			soapConversation.m.forEach((soapMessage) =>
				messages.push(normalizeMailMessageFromSoap(soapMessage, false))
			)
		);
		appendConversations(conversations, offset, searchResponse.more);
		appendMessagesToSearch(messages, offset);
	}
	if (searchResponse.m) {
		const messages: (IncompleteMessage | MailMessage)[] = [];
		searchResponse.m?.forEach((soapMessage) =>
			messages.push(normalizeMailMessageFromSoap(soapMessage, false))
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
	const tags = getTags();
	if (searchResponse.c) {
		handleFulFilledConversationResults({ searchResponse, tags });
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
	searchDisabled: boolean;
	queryToString: string;
	searchResults: SearchIndexSliceState['searchIndexSlice'];
	isInvalidQuery: boolean;
	executeSearch: (abortSignal: AbortSignal) => Promise<void>;
};

export function useRunSearch({
	query,
	updateQuery,
	useDisableSearch,
	invalidQueryTooltip,
	isSharedFolderIncluded
}: UseRunSearchProps): UseRunSearchReturnType {
	const [searchDisabled, setSearchDisabled] = useDisableSearch();
	const settings = useUserSettings();
	const isMessageView = useIsMessageView();
	const folders = useFoldersMap();
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
		[invalidQueryTooltip, isMessageView, prefLocale, queryToString, setSearchDisabled]
	);

	return {
		searchDisabled,
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
				offset,
				recip: '0'
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
