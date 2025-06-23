/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { Suspense, useCallback, useEffect, useMemo, useState } from 'react';

import { Container, Spinner } from '@zextras/carbonio-design-system';
import type { SearchViewProps } from '@zextras/carbonio-search-ui';
import { setAppContext, t, useUserSettings } from '@zextras/carbonio-shell-ui';
import { useUpdateView } from '@zextras/carbonio-ui-commons';
import { Route, Routes } from 'react-router-dom';

import { API_REQUEST_STATUS } from 'constants/index';
import { resetSearchAndPopulatedItems } from 'store/emails/store';
import { SearchConversationList } from 'views/search/list/conversation/search-conversation-list';
import { SearchMessageList } from 'views/search/list/message/search-message-list';
import SearchPanel from 'views/search/panel/search-panel';
import { AdvancedFilterButton } from 'views/search/parts/advanced-filter-button';
import { useIsMessageView, useRunSearch } from 'views/search/search-view-hooks';
import { Query } from 'views/search/types/types';

const specialChars = ["~","'","!","#","$","%","^","&","(",")","_","?","/","{","}","[","]",";",":","-","+","<",">"]
const prefixes = ["has", "is", "Subject", "from", "to", "attachment", "smaller", "larger", "after", "before",  "tag", "in"]

const containsSpecialCharacters = (value: string): boolean => {
	const prefix = prefixes.find((pr) => value.startsWith(`${pr}:`));
	if (prefix === 'attachment' || prefix === 'in' || prefix === 'before' || prefix === 'after') {
		return false;
	}
	const text = prefix ? value.substring(prefix.length + 1) : value;
	return specialChars.some((specialChar) => text.includes(specialChar));
};

const SearchView = ({ useQuery, ResultsHeader }: SearchViewProps): React.JSX.Element => {
	useUpdateView();

	const [query, updateQuery] = useQuery();

	const isMessageView = useIsMessageView();

	const invalidQueryTooltip = useMemo(
		() => t('label.invalid_query', 'Special characters like :, ", -, !, etc., are ignored in the search. This may lead to unexpected results.'),
		[]
	);

	const settings = useUserSettings();
	const includeSharedItemsInSearchDefaultPref =
		settings.prefs.zimbraPrefIncludeSharedItemsInSearch === 'TRUE';
	const [isSharedFolderIncluded, setIsSharedFolderIncluded] = useState<boolean>(
		includeSharedItemsInSearchDefaultPref
	);

	const [count, setCount] = useState(0);

	useEffect(() => {
		setAppContext({ isMessageView, count, setCount });
	}, [count, isMessageView]);

	const { searchResults, isInvalidQuery, queryToString, executeSearch } =
		useRunSearch({
			query,
			updateQuery,
			isSharedFolderIncluded
		});

	const containsSpacialCharacter = useMemo(
		() => query.some((ch) => ch.value !== undefined && containsSpecialCharacters(ch.value)),
		[query]
	);

	const resultLabelType = containsSpacialCharacter ? 'warning' : undefined;

	const resultLabel = useMemo(() => {
		if (containsSpacialCharacter) {
			return invalidQueryTooltip;
		}
		if (!query.length) return '';
		if (searchResults.status === API_REQUEST_STATUS.fulfilled) {
			return t('label.results_for', 'Results for: ');
		}
		if (searchResults.status === API_REQUEST_STATUS.pending) {
			return t('label.loading_results', 'Loading Results...');
		}
		return '';
	}, [isInvalidQuery, searchResults.status, query, invalidQueryTooltip, containsSpacialCharacter]);

	const loading = searchResults.status === API_REQUEST_STATUS.pending;

	useEffect(() => {
		const controller = new AbortController();
		if (query.length > 0) {
			executeSearch(controller.signal);
		} else {
			setIsSharedFolderIncluded(includeSharedItemsInSearchDefaultPref);
			resetSearchAndPopulatedItems();
		}
		return () => {
			controller.abort();
		};
	}, [executeSearch, query, includeSharedItemsInSearchDefaultPref, updateQuery]);

	const onSearchConfirm = useCallback(
		(options: { query: Query; includeSharedFolders: boolean }): void => {
			updateQuery(options.query);
			setIsSharedFolderIncluded(options.includeSharedFolders);
		},
		[updateQuery]
	);

	return (
		<Container>
			{/* TOFIX-SHELL: labetype is missing in shell type declaration as optional and string */}
			<ResultsHeader label={resultLabel} labelType={resultLabelType} />
			<Container
				orientation="horizontal"
				background="gray4"
				style={{ overflowY: 'auto' }}
				mainAlignment="flex-start"
			>
				<Routes>
					<Route
						path={`:type?/:itemId?`}
						element={
							<Container
								background={'gray6'}
								width="25%"
								height="fill"
								mainAlignment="flex-start"
								data-testid="MailsSearchResultListContainer"
							>
								<AdvancedFilterButton
									query={query as Query}
									isSharedFolderIncluded={isSharedFolderIncluded}
									onSearchConfirm={onSearchConfirm}
									invalidQueryTooltip={containsSpacialCharacter ? invalidQueryTooltip : undefined}
								/>
								{isMessageView ? (
									<SearchMessageList
										searchResults={searchResults.messageListIndex}
										query={queryToString}
										loading={loading}
										isInvalidQuery={isInvalidQuery}
										hasMore={searchResults.more}
									/>
								) : (
									<SearchConversationList
										searchResults={searchResults.conversationListIndex}
										query={queryToString}
										loading={loading}
										isInvalidQuery={isInvalidQuery}
										hasMore={searchResults.more}
									/>
								)}
							</Container>
						}
					/>
				</Routes>
				<Suspense fallback={<Spinner color="gray5" />}>
					<Container mainAlignment="flex-start" width="75%">
						<SearchPanel searchResults={searchResults} query={query} />
					</Container>
				</Suspense>
			</Container>
		</Container>
	);
};

export default SearchView;
