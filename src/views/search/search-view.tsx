/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Container, Spinner } from '@zextras/carbonio-design-system';
import { SearchViewProps, setAppContext, t, useUserSettings } from '@zextras/carbonio-shell-ui';
import { Route, Switch, useRouteMatch } from 'react-router-dom';

import { AdvancedFilterModal } from './advanced-filter-modal';
import { SearchConversationList } from './list/conversation/search-conversation-list';
import { SearchMessageList } from './list/message/search-message-list';
import SearchPanel from './panel/search-panel';
import { handleSearchResults, useIsMessageView } from './search-view-hooks';
import { generateQueryString, updateQueryChips } from './utils';
import { searchSoapApi } from '../../api/search';
import { useUpdateView } from '../../carbonio-ui-commons/hooks/use-update-view';
import { useFoldersMap } from '../../carbonio-ui-commons/store/zustand/folder';
import { API_REQUEST_STATUS, LIST_LIMIT } from '../../constants';
import {
	updateSearchResultsLoadingStatus,
	useSearchResults
} from '../../store/zustand/message-store/store';

const SearchView: FC<SearchViewProps> = ({ useDisableSearch, useQuery, ResultsHeader }) => {
	useUpdateView();
	const { path } = useRouteMatch();
	const [query, updateQuery] = useQuery();
	const isMessageView = useIsMessageView();
	const previousQuery = useRef('');
	const [showAdvanceFilters, setShowAdvanceFilters] = useState(false);
	const settings = useUserSettings();
	const includeSharedItemsInSearch = settings.prefs.zimbraPrefIncludeSharedItemsInSearch === 'TRUE';
	const [isSharedFolderIncluded, setIsSharedFolderIncluded] = useState<boolean>(
		includeSharedItemsInSearch
	);
	const invalidQueryTooltip = useMemo(
		() => t('label.invalid_query', 'Unable to parse the search query, clear it and retry'),
		[]
	);

	const [searchDisabled, setSearchDisabled] = useDisableSearch();
	const folders = useFoldersMap();
	const [count, setCount] = useState(0);
	setAppContext({ isMessageView, count, setCount });
	const [filterCount, setFilterCount] = useState(0);
	const [isInvalidQuery, setIsInvalidQuery] = useState<boolean>(false);

	const prefLocale = useMemo(
		() => settings.prefs.zimbraPrefLocale,
		[settings.prefs.zimbraPrefLocale]
	);
	updateQueryChips(query, isInvalidQuery, updateQuery);

	const searchResults = useSearchResults();

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

	const queryToString = useMemo(
		() => generateQueryString(query, isSharedFolderIncluded, folders),
		[query, isSharedFolderIncluded, folders]
	);

	useEffect(() => {
		const controller = new AbortController();
		const { signal } = controller;

		if (previousQuery.current !== queryToString && queryToString.length > 0) {
			firstSearchQueryCallback(queryToString, signal);
			setFilterCount(query.length);
			previousQuery.current = queryToString;
		}
		return () => {
			controller.abort();
			previousQuery.current = '';
		};
	}, [queryToString, firstSearchQueryCallback, query.length]);

	const resultLabelType = isInvalidQuery ? 'warning' : undefined;
	const resultLabel = useMemo(() => {
		if (isInvalidQuery) {
			return invalidQueryTooltip;
		}

		if (searchResults.status === 'fulfilled') {
			return t('label.results_for', 'Results for: ');
		}
		if (searchResults.status === 'pending') {
			return t('label.loading_results', 'Loading Results...');
		}
		return '';
	}, [isInvalidQuery, searchResults.status, invalidQueryTooltip]);

	const loading = searchResults.status === 'pending';

	const onCloseCallback = useCallback(() => {
		setShowAdvanceFilters(false);
	}, [setShowAdvanceFilters]);

	return (
		<>
			<Container>
				{/* TOFIX-SHELL: labetype is missing in shell type declaration as optional and string */}
				<ResultsHeader
					label={resultLabel}
					// eslint-disable-next-line @typescript-eslint/ban-ts-comment
					// @ts-ignore
					labelType={resultLabelType}
				/>
				<Container
					orientation="horizontal"
					background="gray4"
					style={{ overflowY: 'auto' }}
					mainAlignment="flex-start"
				>
					<Switch>
						<Route path={`${path}/:folder?/:folderId?/:type?/:itemId?`}>
							{isMessageView ? (
								<SearchMessageList
									searchDisabled={searchDisabled}
									searchResults={searchResults.messageIds}
									query={queryToString}
									loading={loading}
									filterCount={filterCount}
									setShowAdvanceFilters={setShowAdvanceFilters}
									isInvalidQuery={isInvalidQuery}
									invalidQueryTooltip={invalidQueryTooltip}
									hasMore={searchResults.more}
								/>
							) : (
								<SearchConversationList
									searchDisabled={searchDisabled}
									searchResults={searchResults.conversationIds}
									query={queryToString}
									loading={loading}
									filterCount={filterCount}
									setShowAdvanceFilters={setShowAdvanceFilters}
									isInvalidQuery={isInvalidQuery}
									invalidQueryTooltip={invalidQueryTooltip}
									hasMore={searchResults.more}
								/>
							)}
						</Route>
					</Switch>
					<Suspense fallback={<Spinner color="gray5" />}>
						<Container mainAlignment="flex-start" width="75%">
							<SearchPanel searchResults={searchResults} query={query} />
						</Container>
					</Suspense>
				</Container>
			</Container>
			<AdvancedFilterModal
				// TOFIX: fix type definition
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				query={query}
				// TOFIX-SHELL: fix updateQUeryFunction inside shell type
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				updateQuery={updateQuery}
				isSharedFolderIncluded={isSharedFolderIncluded}
				setIsSharedFolderIncluded={setIsSharedFolderIncluded}
				open={showAdvanceFilters}
				onClose={onCloseCallback}
			/>
		</>
	);
};

export default SearchView;
