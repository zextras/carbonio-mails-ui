/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, Suspense, useCallback, useEffect, useMemo, useState } from 'react';

import { Container, Spinner } from '@zextras/carbonio-design-system';
import {
	SEARCH_APP_ID,
	replaceHistory,
	setAppContext,
	t,
	useUserSettings,
	SearchViewProps
} from '@zextras/carbonio-shell-ui';
import { includes, map, reduce } from 'lodash';
import { Route, Switch, useRouteMatch } from 'react-router-dom';

import { AdvancedFilterModal } from './advanced-filter-modal';
import { findIconFromChip } from './parts/use-find-icon';
import SearchConversationList from './search-conversation-list';
import { SearchMessageList } from './search-message-list';
import SearchPanel from './search-panel';
import { searchNew } from '../../api/search-new';
import { useFoldersMap } from '../../carbonio-ui-commons/store/zustand/folder/hooks';
import type { Folder } from '../../carbonio-ui-commons/types/folder';
import { LIST_LIMIT, MAILS_ROUTE } from '../../constants';
import { useMessageStore } from '../../store/zustand/message-store/store';
import { handleSearchResults } from '../../store/zustand/search/hooks/hooks';

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

	const [loading, setLoading] = useState(false);
	const [filterCount, setFilterCount] = useState(0);
	const [showAdvanceFilters, setShowAdvanceFilters] = useState(false);
	const [isSharedFolderIncluded, setIsSharedFolderIncluded] = useState<boolean>(
		includeSharedItemsInSearch
	);
	const [isInvalidQuery, setIsInvalidQuery] = useState<boolean>(false);
	const searchResults = useMessageStore((state) => state.search);

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
			isSharedFolderIncluded && searchInFolders?.length > 0
				? `(${query.map((c) => (c.value ? c.value : c.label)).join(' ')}) ${foldersToSearchInQuery}`
				: `${query.map((c) => (c.value ? c.value : c.label)).join(' ')}`,
		[foldersToSearchInQuery, isSharedFolderIncluded, query, searchInFolders?.length]
	);

	const searchQuery = useCallback(
		async (queryString: string, reset: boolean) => {
			const offset = reset ? 0 : searchResults.offset;
			const searchResponse = await searchNew({
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
				searchResponse?.Detail?.Error?.Code === 'mail.QUERY_PARSE_ERROR'
			) {
				setIsInvalidQuery(true);
				setSearchDisabled(true, invalidQueryTooltip);
			}
			handleSearchResults({ searchResponse, offset });
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
		if (searchResults.status === 'pending') {
			setLoading(true);
		}
		setLoading(false);
	}, [searchResults.status]);

	useEffect(() => {
		if (query?.length > 0 && !isInvalidQuery) {
			setFilterCount(query.length);
			searchQuery(queryToString, false);
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
	}, [isInvalidQuery, query.length, queryToString, searchQuery]);

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
				onClose={(): void => setShowAdvanceFilters(false)}
			/>
		</>
	);
};

export default SearchView;
