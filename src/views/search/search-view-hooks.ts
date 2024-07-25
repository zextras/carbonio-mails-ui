/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useCallback, useEffect, useMemo, useState } from 'react';

import {
	QueryChip,
	replaceHistory,
	SEARCH_APP_ID,
	setAppContext,
	useUserSettings
} from '@zextras/carbonio-shell-ui';
import { includes, map, reduce } from 'lodash';

import { findIconFromChip } from './parts/use-find-icon';
import { searchSoapApi } from '../../api/search';
import { useFoldersMap } from '../../carbonio-ui-commons/store/zustand/folder';
import type { Folder } from '../../carbonio-ui-commons/types';
import { LIST_LIMIT, MAILS_ROUTE } from '../../constants';
import { useSearchResults } from '../../store/zustand/message-store/store';
import { handleSearchResults } from '../../store/zustand/search/hooks/hooks';
import { SearchSliceState } from '../../types';

type RunSearchCallback = {
	// eslint-disable-next-line @typescript-eslint/ban-types
	useQuery: () => [QueryChip[], Function];
	// eslint-disable-next-line @typescript-eslint/ban-types
	useDisableSearch: () => [boolean, Function];
	invalidQueryTooltip: string;
};

export function useIsMessageView(): boolean {
	const settings = useUserSettings();
	return settings.prefs.zimbraPrefGroupMailBy === 'message';
}

export function useRunSearch({
	useQuery,
	useDisableSearch,
	invalidQueryTooltip
}: RunSearchCallback): {
	isSharedFolderIncluded: boolean;
	setIsSharedFolderIncluded: (value: ((prevState: boolean) => boolean) | boolean) => void;
	query: QueryChip[];
	searchDisabled: boolean;
	queryToString: string;
	loading: boolean;
	searchResults: SearchSliceState['search'];
	isInvalidQuery: boolean;
	filterCount: number;
} {
	const [query, updateQuery] = useQuery();
	const [searchDisabled, setSearchDisabled] = useDisableSearch();
	const settings = useUserSettings();
	const isMessageView = useIsMessageView();
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
	const [isSharedFolderIncluded, setIsSharedFolderIncluded] = useState<boolean>(
		includeSharedItemsInSearch
	);
	const [isInvalidQuery, setIsInvalidQuery] = useState<boolean>(false);
	const searchResults = useSearchResults();

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

	return {
		query,
		searchDisabled,
		filterCount,
		searchResults,
		loading,
		isInvalidQuery,
		queryToString,
		// TODO: these do not belong to this domain, probably better to move them in the advanced filter
		isSharedFolderIncluded,
		setIsSharedFolderIncluded
	};
}
