/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, useEffect, useState, useCallback, useMemo, Suspense } from 'react';
import { Container } from '@zextras/carbonio-design-system';
import { QueryChip, Spinner, t, useUserSettings } from '@zextras/carbonio-shell-ui';
import { Switch, Route, useRouteMatch } from 'react-router-dom';
import { includes, map, reduce } from 'lodash';
import { useDispatch, useSelector } from 'react-redux';
import SearchPanel from './search-panel';
import SearchConversationList from './search-conversation-list';
import AdvancedFilterModal from './advance-filter-modal';
import { findIconFromChip } from './parts/use-find-icon';
import { search } from '../../store/actions';
import { selectSearches } from '../../store/searches-slice';
import SearchMessageList from './search-message-list';
import { FolderType, SearchResults } from '../../types';
import { selectFolders } from '../../store/folders-slice';

type SearchProps = {
	useDisableSearch: () => [boolean, (arg: any) => void];
	useQuery: () => [Array<QueryChip>, (arg: any) => void];
	ResultsHeader: FC<{ label: string }>;
};

const SearchView: FC<SearchProps> = ({ useDisableSearch, useQuery, ResultsHeader }) => {
	const [query, updateQuery] = useQuery();
	const [searchDisabled, setSearchDisabled] = useDisableSearch();
	const settings = useUserSettings();
	const isMessageView = settings.prefs.zimbraPrefGroupMailBy === 'message';
	const folders = useSelector(selectFolders);

	const searchInFolders = useMemo(
		() =>
			reduce(
				folders,
				(acc: Array<string>, v: FolderType, k: string) => {
					if (v.isShared || v.perm) {
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

	const emptySearchResults = useMemo(
		() =>
			({
				conversations: [],
				more: false,
				offset: 0,
				sortBy: 'dateDesc',
				query: []
			} as SearchResults),
		[]
	);
	const dispatch = useDispatch();
	const [loading, setLoading] = useState(false);
	const [filterCount, setFilterCount] = useState(0);
	const [showAdvanceFilters, setShowAdvanceFilters] = useState(false);
	const [isSharedFolderIncluded, setIsSharedFolderIncluded] = useState(true);
	const [isInvalidQuery, setIsInvalidQuery] = useState<boolean>(false);
	const searchResults = useSelector(selectSearches);

	const resultLabel = useMemo(() => {
		if (searchResults.status === 'fulfilled') {
			return t('label.results_for', 'Results for: ');
		}
		if (searchResults.status === 'pending') {
			return t('label.loading_results', 'Loading Results...');
		}
		return '';
	}, [searchResults.status]);

	const queryToString = useMemo(
		() =>
			isSharedFolderIncluded && searchInFolders?.length > 0
				? `(${query.map((c) => (c.value ? c.value : c.label)).join(' ')}) ${foldersToSearchInQuery}`
				: `${query.map((c) => (c.value ? c.value : c.label)).join(' ')}`,
		[isSharedFolderIncluded, searchInFolders.length, query, foldersToSearchInQuery]
	);

	const searchQuery = useCallback(
		(queryString: string, reset: boolean) => {
			dispatch(
				search({
					query: queryString,
					limit: 100,
					sortBy: 'dateDesc',
					types: isMessageView ? 'message' : 'conversation',
					offset: reset ? 0 : searchResults.offset,
					recip: '0'
				})
			);
		},
		[dispatch, isMessageView, searchResults.offset]
	);

	const queryArray = useMemo(() => ['has:attachment', 'is:flagged', 'is:unread'], []);
	const findIcon = useCallback((chip) => findIconFromChip(chip), []);

	useEffect(() => {
		let count = 0;
		if (query && query.length > 0 && queryToString !== searchResults.query && !isInvalidQuery) {
			const modifiedQuery = map(query, (q) => {
				if (
					(includes(queryArray, q.label) ||
						/^subject:/.test(q.label) ||
						/^in:/.test(q.label) ||
						/^before:/.test(q.label) ||
						/^after:/.test(q.label) ||
						/^tag:/.test(q.label) ||
						/^date:/.test(q.label)) &&
					!includes(Object.keys(q), 'isGeneric') &&
					!includes(Object.keys(q), 'isQueryFilter')
				) {
					count += 1;
					return findIcon(q);
				}
				return { ...q };
			});

			if (count > 0) {
				updateQuery(modifiedQuery);
			}
		}
	}, [
		searchResults,
		queryArray,
		updateQuery,
		findIcon,
		isInvalidQuery,
		emptySearchResults,
		query,
		queryToString
	]);

	useEffect(() => {
		if (searchResults.status === 'pending') {
			setLoading(true);
		}
		setLoading(false);
	}, [searchResults.status]);

	useEffect(() => {
		if (query && query.length > 0 && queryToString !== searchResults.query && !isInvalidQuery) {
			setFilterCount(query.length);
			searchQuery(queryToString, true);
		}
		if (query && query.length === 0) {
			setFilterCount(0);
			setIsInvalidQuery(false);
		}
	}, [
		dispatch,
		isInvalidQuery,
		isMessageView,
		query,
		queryToString,
		searchQuery,
		searchResults.query
	]);

	const { path } = useRouteMatch();

	return (
		<>
			<Container>
				<ResultsHeader label={resultLabel} />
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
								/>
							)}
						</Route>
					</Switch>
					<Suspense fallback={<Spinner />}>
						<Container mainAlignment="flex-start" width="75%">
							<SearchPanel searchResults={searchResults} query={query} />
						</Container>
					</Suspense>
				</Container>
			</Container>
			<AdvancedFilterModal
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
