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
	useUserSettings,
	type SearchViewProps
} from '@zextras/carbonio-shell-ui';
import { includes, map } from 'lodash';
import { Route, Switch, useRouteMatch } from 'react-router-dom';

import { AdvancedFilterModal } from './advanced-filter-modal';
import { BackupSearchMessageList } from './backup-search-message-list';
import { findIconFromChip } from './parts/use-find-icon';
import SearchConversationList from './search-conversation-list';
import { SearchMessageList } from './search-message-list';
import SearchPanel from './search-panel';
import { getFoldersNameArray } from './utils';
import { useFoldersMap } from '../../carbonio-ui-commons/store/zustand/folder/hooks';
import { LIST_LIMIT, MAILS_ROUTE } from '../../constants';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { search } from '../../store/actions/search';
import { selectBackupSearchMessagesStore } from '../../store/backup-search-slice';
import { resetSearchResults, selectSearches } from '../../store/searches-slice';
import { SearchesStateType } from '../../types';

const SearchView: FC<SearchViewProps> = ({ useDisableSearch, useQuery, ResultsHeader }) => {
	const [query, updateQuery] = useQuery();
	const [searchDisabled, setSearchDisabled] = useDisableSearch();
	const settings = useUserSettings();
	const isMessageView = settings.prefs.zimbraPrefGroupMailBy === 'message';
	const includeSharedItemsInSearch = settings.prefs.zimbraPrefIncludeSharedItemsInSearch === 'TRUE';
	const folders = useFoldersMap();
	const [count, setCount] = useState(0);

	const prefLocale = useMemo(
		() => settings.prefs.zimbraPrefLocale,
		[settings.prefs.zimbraPrefLocale]
	);

	useEffect(() => {
		setAppContext({ isMessageView, count, setCount });
	}, [count, isMessageView]);

	const foldersToSearchInQuery = useMemo(() => {
		const folderQueries = getFoldersNameArray(folders)
			.map((folder: string) => `inid:"${folder}"`)
			.join(' OR ');
		return `( ${folderQueries} OR is:local) `;
	}, [folders]);

	const dispatch = useAppDispatch();
	const [loading, setLoading] = useState(false);
	const [filterCount, setFilterCount] = useState(0);
	const [showAdvanceFilters, setShowAdvanceFilters] = useState(false);
	const [isSharedFolderIncluded, setIsSharedFolderIncluded] = useState<boolean>(
		includeSharedItemsInSearch
	);
	const [isInvalidQuery, setIsInvalidQuery] = useState<boolean>(false);
	const searchStore = useAppSelector(selectSearches);
	const backupSearchStore = useAppSelector(selectBackupSearchMessagesStore);
	const isBackupSearchResultView = backupSearchStore.status !== 'empty' && searchStore;
	const searchResults = isBackupSearchResultView ? backupSearchStore : searchStore;

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
		if (searchResults.status === 'pending') {
			return t('label.loading_results', 'Loading Results...');
		}
		return '';
	}, [isInvalidQuery, searchResults.status, invalidQueryTooltip]);

	const queryToString = useMemo(
		() =>
			isSharedFolderIncluded && getFoldersNameArray(folders).length > 0
				? `(${query.map((c) => (c.value ? c.value : c.label)).join(' ')}) ${foldersToSearchInQuery}`
				: `${query.map((c) => (c.value ? c.value : c.label)).join(' ')}`,
		[isSharedFolderIncluded, folders, query, foldersToSearchInQuery]
	);
	const isQuerySearchResult = 'query' in searchResults;

	const searchQuery = useCallback(
		async (queryString: string, reset: boolean) => {
			const resultAction = await dispatch(
				search({
					query: queryString,
					limit: LIST_LIMIT.INITIAL_LIMIT,
					sortBy: 'dateDesc',
					types: isMessageView ? 'message' : 'conversation',
					offset: reset ? 0 : (searchResults as SearchesStateType).offset,
					recip: '0',
					locale: prefLocale
				})
			);
			if (
				search.rejected.match(resultAction) &&
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				resultAction?.payload?.Detail?.Error?.Code === 'mail.QUERY_PARSE_ERROR'
			) {
				setIsInvalidQuery(true);
				setSearchDisabled(true, invalidQueryTooltip);
			}
		},
		[dispatch, invalidQueryTooltip, isMessageView, prefLocale, searchResults, setSearchDisabled]
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
		}
		setLoading(false);
	}, [searchResults.status]);

	useEffect(() => {
		if (query && query.length > 0 && !isInvalidQuery) {
			setFilterCount(query.length);
			searchQuery(queryToString, true);
		}
		if (query && query.length === 0) {
			setFilterCount(0);
			setIsInvalidQuery(false);
			dispatch(resetSearchResults());
			replaceHistory({
				path: MAILS_ROUTE,
				route: SEARCH_APP_ID
			});
		}
	}, [query, queryArray, isInvalidQuery, searchQuery, queryToString, dispatch]);

	const { path } = useRouteMatch();
	const resultLabelType = isInvalidQuery ? 'warning' : undefined;

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
							{isBackupSearchResultView && !isQuerySearchResult && (
								<BackupSearchMessageList
									searchResults={searchResults.messages}
									// search={searchQuery}
									// query={queryToString}
									// loading={loading}
									// filterCount={filterCount}
									// setShowAdvanceFilters={setShowAdvanceFilters}
									// isInvalidQuery={isInvalidQuery}
									// invalidQueryTooltip={invalidQueryTooltip}
								/>
							)}

							{isMessageView && isQuerySearchResult ? (
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
								isQuerySearchResult && (
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
								)
							)}
						</Route>
					</Switch>
					<Suspense fallback={<Spinner />}>
						<Container mainAlignment="flex-start" width="75%">
							{isQuerySearchResult && <SearchPanel searchResults={searchResults} query={query} />}
						</Container>
					</Suspense>
				</Container>
			</Container>
			{isQuerySearchResult && (
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
					onClose={(): void => setShowAdvanceFilters(false)}
				/>
			)}
		</>
	);
};

export default SearchView;
