/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, useEffect, useState, useCallback, useMemo, Suspense } from 'react';
import { Container } from '@zextras/carbonio-design-system';
import {
	FOLDERS,
	QueryChip,
	Spinner,
	useAppContext,
	useUserSettings
} from '@zextras/carbonio-shell-ui';
import { useTranslation } from 'react-i18next';
import { Switch, Route, useRouteMatch } from 'react-router-dom';
import { filter, includes, map } from 'lodash';
import { useDispatch, useSelector } from 'react-redux';
import SearchPanel from './search-panel';
import SearchConversationList from './search-conversation-list';
import AdvancedFilterModal from './advance-filter-modal';
import { findIconFromChip } from './parts/use-find-icon';
import { search } from '../../store/actions/search';
import { selectSearchesConvArray } from '../../store/searches-slice';
import SearchMessageList from './search-message-list';
import { SearchResults } from '../../types';

type SearchProps = {
	useDisableSearch: () => [boolean, (arg: any) => void];
	useQuery: () => [Array<QueryChip>, (arg: any) => void];
	ResultsHeader: FC<{ label: string }>;
};

const SearchView: FC<SearchProps> = ({ useDisableSearch, useQuery, ResultsHeader }) => {
	const [query, updateQuery] = useQuery();
	const [searchDisabled, setSearchDisabled] = useDisableSearch();
	const settings = useUserSettings();
	const sortBySetting = settings.prefs.zimbraPrefConvListSortBy as 'dateDesc' | 'dateAsc';
	const isMessageView = settings.prefs.zimbraPrefGroupMailBy === 'message';

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
	const [t] = useTranslation();
	const dispatch = useDispatch();
	const [resultLabel, setResultLabel] = useState<string>('');
	const [filterCount, setFilterCount] = useState(0);
	const [showAdvanceFilters, setShowAdvanceFilters] = useState(false);
	const [isInvalidQuery, setIsInvalidQuery] = useState<boolean>(false);
	const searchResults = useSelector(selectSearchesConvArray);
	useEffect(() => {
		switch (searchResults.status) {
			case 'fulfilled':
				setResultLabel(t('label.results_for', 'Results for: '));
				break;
			case 'pending':
				setResultLabel(t('label.loading_results', 'Loading Results...'));
				break;
			default:
				setResultLabel('');
		}
	}, [searchResults.status, t]);

	const queryToString = useMemo(
		() => `${query.map((c) => (c.value ? c.value : c.label)).join(' ')}`,
		[query]
	);

	const searchQuery = useCallback(
		(queryString: string, reset: boolean) => {
			dispatch(
				search({
					query: queryString,
					limit: 100,
					sortBy: sortBySetting,
					types: isMessageView ? 'message' : 'conversation',
					offset: reset ? 0 : searchResults.offset,
					recip: '0'
				})
			);
		},
		[dispatch, isMessageView, searchResults.offset, sortBySetting]
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
				// setLoading(true);
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

	const loading = useMemo(() => {
		if (searchResults.status === 'pending') {
			return true;
		}
		return false;
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
	}, [query, queryArray, t, isInvalidQuery, searchQuery, searchResults.query, queryToString]);

	const filteredSearchResults = useMemo(() => {
		const conversations = filter(searchResults.conversations, (conv) => {
			if (conv.parent === FOLDERS.TRASH) {
				return false;
			}
			return true;
		});
		return { ...searchResults, conversations };
	}, [searchResults]);

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
									searchResults={filteredSearchResults}
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
									searchResults={filteredSearchResults}
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
							<SearchPanel searchResults={filteredSearchResults} query={query} />
						</Container>
					</Suspense>
				</Container>
			</Container>
			<AdvancedFilterModal
				query={query}
				updateQuery={updateQuery}
				open={showAdvanceFilters}
				onClose={(): void => setShowAdvanceFilters(false)}
				t={t}
			/>
		</>
	);
};

export default SearchView;
