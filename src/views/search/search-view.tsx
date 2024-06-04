/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, Suspense, useCallback, useEffect, useMemo, useState } from 'react';

import { Container } from '@zextras/carbonio-design-system';
import {
	SEARCH_APP_ID,
	Spinner,
	replaceHistory,
	setAppContext,
	t,
	useUserSettings
} from '@zextras/carbonio-shell-ui';
import { includes, map, reduce } from 'lodash';
import { Route, Switch, useRouteMatch } from 'react-router-dom';

import { AdvancedFilterModal } from './advanced-filter-modal';
import { findIconFromChip } from './parts/use-find-icon';
import SearchConversationList from './search-conversation-list';
import { SearchMessageList } from './search-message-list';
import SearchPanel from './search-panel';
import { useFoldersMap } from '../../carbonio-ui-commons/store/zustand/folder/hooks';
import type { Folder } from '../../carbonio-ui-commons/types/folder';
import { LIST_LIMIT, MAILS_ROUTE } from '../../constants';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { search } from '../../store/actions/search';
import { resetSearchResults, selectSearches } from '../../store/searches-slice';
import type { SearchProps } from '../../types';
import { isSharedAccountFolder } from '../../helpers/folders';

const SearchView: FC<SearchProps> = ({ useDisableSearch, useQuery, ResultsHeader }) => {
	const [query, updateQuery] = useQuery();
	const [searchDisabled, setSearchDisabled] = useDisableSearch();
	const settings = useUserSettings();
	const isMessageView = settings.prefs.zimbraPrefGroupMailBy === 'message';
	const includeSharedItemsInSearch = settings.prefs.zimbraPrefIncludeSharedItemsInSearch === 'TRUE';
	const folders = useFoldersMap();
	const [count, setCount] = useState(0);
	const [containerWidth, setContainerWidth] = useState('70%');
	const dispatch = useAppDispatch();
	const [newSearch, setNewSearch] = useState(true);

	useEffect(() => {
		const element = document.getElementById("appContainerSearch");
		if (!element) return;

		const observer = new ResizeObserver(() => {
			// 👉 Do something when the element is resized
			setContainerWidth(`calc(100% - ${element.offsetWidth}px)`);
		});

		observer.observe(element);
		return () => {
			// Cleanup the observer by unobserving all elements
			observer.disconnect();
		};
	}, []);

	const prefLocale = useMemo(
		() => settings.prefs.zimbraPrefLocale,
		[settings.prefs.zimbraPrefLocale]
	);

	useEffect(() => {
		const lastApp = localStorage.getItem('lastApp');
		if ( lastApp == "mail" || lastApp == "" ) {
			dispatch(resetSearchResults());
			setNewSearch(true);
		}
		localStorage.setItem('lastApp','search');
		setAppContext({ isMessageView, count, setCount });
	}, [count, isMessageView, dispatch]);

	const searchInFolders = useMemo(
		() =>
			reduce(
				folders,
				(acc: Array<string>, v: Folder, k: string) => {
					if (isSharedAccountFolder(v.id) || v.perm) {
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

	const [loading, setLoading] = useState(false);
	const [filterCount, setFilterCount] = useState(0);
	const [showAdvanceFilters, setShowAdvanceFilters] = useState(false);
	const [isSharedFolderIncluded, setIsSharedFolderIncluded] = useState<boolean>(
		includeSharedItemsInSearch
	);
	const [isInvalidQuery, setIsInvalidQuery] = useState<boolean>(false);
	const searchResults = useAppSelector(selectSearches);

	const invalidQueryTooltip = useMemo(
		() => t('label.invalid_query', 'Unable to parse the search query, clear it and retry'),
		[]
	);

	const resultLabel = useMemo(() => {
		if (isInvalidQuery) {
			return invalidQueryTooltip;
		}

		if (searchResults.status === 'fulfilled') {
			return t('label.results_for', 'Results for: ');
		}
		if (searchResults.status === 'pending' && loading) {
			return t('label.loading_results', 'Loading Results...');
		}
		return '';
	}, [isInvalidQuery, searchResults.status, invalidQueryTooltip, loading]);

	const queryToString = useMemo(
		() =>
			isSharedFolderIncluded && searchInFolders?.length > 0
				? `(${query.map((c) => (c.value ? c.value : c.label)).join(' ')}) ${foldersToSearchInQuery}`
				: `${query.map((c) => (c.value ? c.value : c.label)).join(' ')}`,
		[isSharedFolderIncluded, searchInFolders.length, query, foldersToSearchInQuery]
	);

	const searchQuery = useCallback(
		async (queryString: string, reset: boolean) => {
			const resultAction = await dispatch(
				search({
					query: queryString,
					limit: LIST_LIMIT.INITIAL_LIMIT,
					sortBy: 'dateDesc',
					types: isMessageView ? 'message' : 'conversation',
					offset: reset ? 0 : searchResults.offset,
					recip: '0',
					locale: prefLocale
				})
			);
			if (search.rejected.match(resultAction)) {
				if (
					// eslint-disable-next-line @typescript-eslint/ban-ts-comment
					// @ts-ignore
					resultAction?.payload?.Detail?.Error?.Code === 'mail.QUERY_PARSE_ERROR'
				) {
					setIsInvalidQuery(true);
					setSearchDisabled(true, invalidQueryTooltip);
				}
			}
		},
		[
			dispatch,
			invalidQueryTooltip,
			isMessageView,
			prefLocale,
			searchResults.offset,
			setSearchDisabled
		]
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
	}, [searchResults, queryArray, updateQuery, findIcon, isInvalidQuery, query, queryToString]);

	useEffect(() => {
		if (searchResults.status === 'pending') {
			setLoading(true);
		} else {
			setLoading(false);
		}
	}, [searchResults.status]);

	useEffect(() => {
		if (query && query.length > 0 && !newSearch && searchResults.query !== '' && queryToString !== searchResults.query) {
			setNewSearch(true);
			setFilterCount(0);
			setIsInvalidQuery(false);
			dispatch(resetSearchResults());
			replaceHistory({
				path: MAILS_ROUTE,
				route: SEARCH_APP_ID
			});
		}
		if (query && query.length > 0 && !isInvalidQuery && newSearch && queryToString !== searchResults.query) {
			setFilterCount(query.length);
			searchQuery(queryToString, true);
			setNewSearch(false);
		}
		if (query && query.length === 0) {
			setNewSearch(true);
			setFilterCount(0);
			setIsInvalidQuery(false);
			dispatch(resetSearchResults());
			replaceHistory({
				path: MAILS_ROUTE,
				route: SEARCH_APP_ID
			});
		}
	}, [
		query,
		queryArray,
		isInvalidQuery,
		searchQuery,
		searchResults.query,
		newSearch,
		queryToString,
		dispatch
	]);

	const { path } = useRouteMatch();
	const resultLabelType = isInvalidQuery ? 'warning' : undefined;

	return (
		<>
			<Container>
				<ResultsHeader label={resultLabel} labelType={resultLabelType} />
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
									searchResults={searchResults}
									search={searchQuery}
									query={queryToString}
									loading={loading}
									filterCount={filterCount}
									setShowAdvanceFilters={setShowAdvanceFilters}
									isInvalidQuery={isInvalidQuery}
									invalidQueryTooltip={invalidQueryTooltip}
								/>
							) : (
								<SearchConversationList
									searchDisabled={searchDisabled}
									searchResults={searchResults}
									search={searchQuery}
									query={queryToString}
									loading={loading}
									filterCount={filterCount}
									setShowAdvanceFilters={setShowAdvanceFilters}
									isInvalidQuery={isInvalidQuery}
									invalidQueryTooltip={invalidQueryTooltip}
								/>
							)}
						</Route>
					</Switch>
					<Suspense fallback={<Spinner />}>
						<Container mainAlignment="flex-start" width={containerWidth} data-testid="search-view-panel"
							style={{
								maxWidth: '100%',
								minWidth: '30%'
							}}
						>
							<SearchPanel searchResults={searchResults} query={query} />
						</Container>
					</Suspense>
				</Container>
			</Container>
			<AdvancedFilterModal
				// TODO: fix type definition
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				query={query}
				updateQuery={updateQuery}
				isSharedFolderIncluded={isSharedFolderIncluded}
				setIsSharedFolderIncluded={setIsSharedFolderIncluded}
				open={showAdvanceFilters}
				onClose={(): void => setShowAdvanceFilters(false)}
			/>
		</>
	);
};

export default SearchView;
