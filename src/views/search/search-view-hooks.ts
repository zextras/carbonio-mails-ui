/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useCallback, useEffect, useMemo, useState } from 'react';

import {
	ErrorSoapBodyResponse,
	getTags,
	QueryChip,
	replaceHistory,
	SEARCH_APP_ID,
	setAppContext,
	Tags,
	useUserSettings
} from '@zextras/carbonio-shell-ui';
import { includes, map, reduce } from 'lodash';

import { findIconFromChip } from './parts/use-find-icon';
import { searchSoapApi } from '../../api/search';
import { useFoldersMap } from '../../carbonio-ui-commons/store/zustand/folder';
import type { Folder } from '../../carbonio-ui-commons/types';
import { API_REQUEST_STATUS, LIST_LIMIT, MAILS_ROUTE } from '../../constants';
import { mapToNormalizedConversation } from '../../normalizations/normalize-conversation';
import { normalizeMailMessageFromSoap } from '../../normalizations/normalize-message';
import {
	appendConversations,
	appendMessages,
	resetSearch,
	setConversations,
	setMessages,
	updateSearchResultsLoadingStatus,
	useSearchResults
} from '../../store/zustand/message-store/store';
import { IncompleteMessage, MailMessage, SearchResponse, SearchSliceState } from '../../types';

type RunSearchCallback = {
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
	setConversations(conversations, offset, searchResponse.more);
	setMessages(messages, offset);
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
	searchResponse,
	offset
}: {
	searchResponse: SearchResponse;
	offset: number;
}): void {
	const normalizedMessages = map(searchResponse.m, (msg) =>
		normalizeMailMessageFromSoap(msg, false)
	);

	setMessages(normalizedMessages, offset);
}

function handleSearchResults({
	searchResponse,
	offset
}: {
	searchResponse: SearchResponse | ErrorSoapBodyResponse;
	offset: number;
}): void {
	if ('Fault' in searchResponse) {
		return;
	}
	const tags = getTags();
	resetSearch();

	if (searchResponse.c) {
		handleFulFilledConversationResults({ searchResponse, offset, tags });
	}

	if (searchResponse.m) {
		handleFulFilledMessagesResults({ searchResponse, offset });
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
}: RunSearchCallback): {
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
	const [count, setCount] = useState(0);

	const prefLocale = useMemo(
		() => settings.prefs.zimbraPrefLocale,
		[settings.prefs.zimbraPrefLocale]
	);

	useEffect(() => {
		setAppContext({ isMessageView, count, setCount });
	}, [count, isMessageView]);

	const searchInFolders = useMemo(
		() =>
			reduce(
				folders,
				(acc: Array<string>, v: Folder, k: string) => {
					if (v.perm) {
						acc.push(k);
					}
					return acc;
				},
				[]
			),
		[folders]
	);

	const foldersToSearchInQuery = useMemo(
		() => `( ${map(searchInFolders, (folder) => `inid:"${folder}"`).join(' OR ')} OR is:local) `,
		[searchInFolders]
	);

	const [filterCount, setFilterCount] = useState(0);

	const [isInvalidQuery, setIsInvalidQuery] = useState<boolean>(false);
	const searchResults = useSearchResults();

	const queryToString = useMemo(
		() =>
			isSharedFolderIncluded && searchInFolders?.length > 0
				? `(${query.map((c) => (c.value ? c.value : c.label)).join(' ')}) ${foldersToSearchInQuery}`
				: `${query.map((c) => (c.value ? c.value : c.label)).join(' ')}`,
		[foldersToSearchInQuery, isSharedFolderIncluded, query, searchInFolders?.length]
	);

	const searchQueryCallback = useCallback(
		async (queryString: string, reset: boolean) => {
			const offset = reset ? 0 : searchResults.offset;
			const searchResponse = await searchSoapApi({
				query: queryString,
				limit: LIST_LIMIT.INITIAL_LIMIT,
				sortBy: 'dateDesc',
				types: isMessageView ? 'message' : 'conversation',
				offset,
				recip: '0',
				locale: prefLocale
			});
			if (
				'Fault' in searchResponse &&
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				searchResponse?.Fault?.Detail?.Error?.Code === 'mail.QUERY_PARSE_ERROR'
			) {
				updateSearchResultsLoadingStatus(API_REQUEST_STATUS.error);
				setIsInvalidQuery(true);
				setSearchDisabled(true, invalidQueryTooltip);
			} else {
				handleSearchResults({ searchResponse, offset });
			}
		},
		[invalidQueryTooltip, isMessageView, prefLocale, searchResults.offset, setSearchDisabled]
	);

	const queryArray = useMemo(() => ['has:attachment', 'is:flagged', 'is:unread'], []);
	const findIcon = useCallback((chip) => findIconFromChip(chip), []);

	useEffect(() => {
		let _count = 0;
		if (query && query.length > 0 && !isInvalidQuery) {
			const modifiedQuery = map(query, (q) => {
				if (
					// TODO: fix type definition
					// eslint-disable-next-line @typescript-eslint/ban-ts-comment
					// @ts-ignore
					(includes(queryArray, q.label) ||
						// TODO: fix type definition
						// eslint-disable-next-line @typescript-eslint/ban-ts-comment
						// @ts-ignore
						/^subject:/.test(q.label) ||
						// TODO: fix type definition
						// eslint-disable-next-line @typescript-eslint/ban-ts-comment
						// @ts-ignore
						/^in:/.test(q.label) ||
						// TODO: fix type definition
						// eslint-disable-next-line @typescript-eslint/ban-ts-comment
						// @ts-ignore
						/^before:/.test(q.label) ||
						// TODO: fix type definition
						// eslint-disable-next-line @typescript-eslint/ban-ts-comment
						// @ts-ignore
						/^after:/.test(q.label) ||
						// TODO: fix type definition
						// eslint-disable-next-line @typescript-eslint/ban-ts-comment
						// @ts-ignore
						/^tag:/.test(q.label) ||
						// TODO: fix type definition
						// eslint-disable-next-line @typescript-eslint/ban-ts-comment
						// @ts-ignore
						/^date:/.test(q.label)) &&
					!includes(Object.keys(q), 'isGeneric') &&
					!includes(Object.keys(q), 'isQueryFilter')
				) {
					_count += 1;
					return findIcon(q);
				}
				return { ...q };
			});

			if (_count > 0) {
				updateQuery(modifiedQuery);
			}
		}
	}, [findIcon, isInvalidQuery, query, queryArray, updateQuery]);

	useEffect(() => {
		if (query?.length > 0 && !isInvalidQuery && searchResults.offset === 0) {
			setFilterCount(query.length);
			searchQueryCallback(queryToString, false);
		}
		if (query?.length === 0) {
			setFilterCount(0);
			setIsInvalidQuery(false);
			// TODO: CO-1144 reset searches
			// dispatch(resetSearchResults());
			replaceHistory({
				path: MAILS_ROUTE,
				route: SEARCH_APP_ID
			});
		}
	}, [isInvalidQuery, query.length, queryToString, searchQueryCallback, searchResults.offset]);

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
	loading
}: {
	query: string;
	offset: number;
	hasMore?: boolean;
	loading: boolean;
}): () => void {
	return useCallback(async () => {
		if (hasMore && !loading) {
			updateSearchResultsLoadingStatus(API_REQUEST_STATUS.pending);
			const searchResponse = await searchSoapApi({
				query,
				limit: LIST_LIMIT.LOAD_MORE_LIMIT,
				sortBy: 'dateDesc',
				types: 'conversation',
				offset,
				recip: '0'
			});
			if ('Fault' in searchResponse) {
				updateSearchResultsLoadingStatus(API_REQUEST_STATUS.error);
			} else if (searchResponse.c) {
				updateSearchResultsLoadingStatus(API_REQUEST_STATUS.fulfilled);
				const tags = getTags();
				handleLoadMoreConversationResults({ searchResponse, offset, tags });
			}
		}
	}, [hasMore, loading, offset, query]);
}
