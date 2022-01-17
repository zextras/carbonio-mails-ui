/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, useEffect, useState, useCallback, useMemo, Suspense } from 'react';
import { Container } from '@zextras/carbonio-design-system';
import { soapFetch, Spinner } from '@zextras/zapp-shell';
import { useTranslation } from 'react-i18next';
import { Switch, Route, useRouteMatch } from 'react-router-dom';
import { includes, map } from 'lodash';
import SearchPanel from './search-panel';
import { normalizeConversation } from '../../normalizations/normalize-conversation';
import { SearchResponse } from '../../types/soap/search';
import { Conversation } from '../../types/conversation';
import SearchList from './search-list';
import AdvancedFilterModal from './advance-filter-modal';
import { findIconFromChip } from './parts/use-find-icon';

type SearchProps = {
	useDisableSearch: () => [boolean, (arg: any) => void];
	useQuery: () => [Array<any>, (arg: any) => void];
	ResultsHeader: FC<{ label: string }>;
};

type SearchResults = {
	conversations: Array<Conversation>;
	more: boolean;
	offset: number;
	sortBy: string;
	query: Array<{
		label: string;
		value?: string;
		isGeneric?: boolean;
		isQueryFilter?: boolean;
		hasAvatar?: boolean;
	}>;
};

const SearchView: FC<SearchProps> = ({ useDisableSearch, useQuery, ResultsHeader }) => {
	const [query, updateQuery] = useQuery();
	const [searchDisabled, setSearchDisabled] = useDisableSearch();

	const emptySearchResults = useMemo(
		() => ({
			conversations: [],
			more: false,
			offset: 0,
			sortBy: 'dateDesc',
			query: []
		}),
		[]
	);
	const [t] = useTranslation();
	const [resultLabel, setResultLabel] = useState<string>(t('label.results_for', 'Results for: '));
	const [searchResults, setSearchResults] = useState<SearchResults>(emptySearchResults);

	const [loading, setLoading] = useState(false);
	const [filterCount, setFilterCount] = useState(0);
	const [showAdvanceFilters, setShowAdvanceFilters] = useState(false);
	const [isInvalidQuery, setIsInvalidQuery] = useState<boolean>(false);

	const search = useCallback(
		(queryStr: Array<{ label: string; value?: string }>, reset: boolean) => {
			setLoading(true);
			setResultLabel(t('label.loading_results', 'Loading Results...'));
			(
				soapFetch<any, SearchResponse>('Search', {
					fullConversation: 1,
					limit: 100,
					query: `${queryStr.map((c) => (c.value ? c.value : c.label)).join(' ')}`,
					offset: reset ? 0 : searchResults.offset,
					sortBy: searchResults.sortBy,
					types: 'conversation',
					_jsns: 'urn:zimbraMail'
				}) as Promise<SearchResponse>
			)
				.then(
					({ c, more, offset, sortBy }): SearchResults => ({
						query: queryStr,
						conversations: [
							...(reset ? [] : searchResults.conversations ?? []),
							...(map(c ?? [], normalizeConversation) as unknown as Array<Conversation>)
						],
						more,
						offset: (offset ?? 0) + 100,
						sortBy: sortBy ?? 'dateDesc'
					})
				)
				.then((r) => {
					setIsInvalidQuery(false);
					setSearchResults(r);
					setLoading(false);
					setResultLabel(t('label.results_for', 'Results for: '));
				})
				.catch((err) => {
					setLoading(false);
					const tempDestructuring = [...queryStr];
					const newQueryStr = map(tempDestructuring, (qs) => ({
						...qs,
						disabled: true,
						isQueryFilter: true
					}));
					setIsInvalidQuery(true);
					setSearchDisabled(true);
					updateQuery(newQueryStr);
					setResultLabel(
						t('label.results_for_error', 'Unable to start the search, clear it and retry: ')
					);
				});
		},
		[
			searchResults.offset,
			searchResults.sortBy,
			searchResults.conversations,
			t,
			updateQuery,
			setSearchDisabled
		]
	);
	const queryArray = useMemo(() => ['has:attachment', 'is:flagged', 'is:unread'], []);
	const findIcon = useCallback((chip) => findIconFromChip(chip), []);

	useEffect(() => {
		let count = 0;
		if (query && query.length > 0 && query !== searchResults.query && !isInvalidQuery) {
			const modifiedQuery = map(query, (q) => {
				if (
					(includes(queryArray, q.label) ||
						/^subject:*/.test(q.label) ||
						/^in:*/.test(q.label) ||
						/^before:*/.test(q.label) ||
						/^after:*/.test(q.label) ||
						/^tag:*/.test(q.label) ||
						/^date:*/.test(q.label)) &&
					!includes(Object.keys(q), 'isGeneric') &&
					!includes(Object.keys(q), 'isQueryFilter')
				) {
					count += 1;
					return findIcon(q);
				}
				return { ...q };
			});

			if (count > 0) {
				setLoading(true);
				updateQuery(modifiedQuery);
			}
		}
		if (query.length === 0) {
			// setSearchResults(emptySearchResults);
		}
	}, [query, searchResults, queryArray, updateQuery, findIcon, isInvalidQuery, emptySearchResults]);

	useEffect(() => {
		if (query && query.length > 0 && query !== searchResults.query && !isInvalidQuery) {
			setLoading(true);
			setFilterCount(query.length);
			search(query, true);
		}
		if (query && query.length === 0) {
			setFilterCount(0);
			setIsInvalidQuery(false);
			setResultLabel(t('label.results_for', 'Results for: '));
		}
	}, [query, search, searchResults.query, queryArray, t, isInvalidQuery]);

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
							<SearchList
								searchDisabled={searchDisabled}
								searchResults={searchResults}
								search={search}
								query={query}
								loading={loading}
								filterCount={filterCount}
								setShowAdvanceFilters={setShowAdvanceFilters}
								isInvalidQuery={isInvalidQuery}
							/>
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
				open={showAdvanceFilters}
				onClose={(): void => setShowAdvanceFilters(false)}
				t={t}
			/>
		</>
	);
};

export default SearchView;
