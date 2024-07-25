/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, Suspense, useMemo, useState } from 'react';

import { Container, Spinner } from '@zextras/carbonio-design-system';
import { SearchViewProps, t } from '@zextras/carbonio-shell-ui';
import { Route, Switch, useRouteMatch } from 'react-router-dom';

import { AdvancedFilterModal } from './advanced-filter-modal';
import SearchPanel from './panel/search-panel';
import SearchConversationList from './search-conversation-list';
import { SearchMessageList } from './search-message-list';
import { useIsMessageView, useRunSearch } from './search-view-hooks';

const SearchView: FC<SearchViewProps> = ({ useDisableSearch, useQuery, ResultsHeader }) => {
	const [updateQuery] = useQuery();
	const invalidQueryTooltip = useMemo(
		() => t('label.invalid_query', 'Unable to parse the search query, clear it and retry'),
		[]
	);
	const {
		queryToString,
		isInvalidQuery,
		loading,
		query,
		searchDisabled,
		searchResults,
		filterCount,
		setIsSharedFolderIncluded,
		isSharedFolderIncluded
	} = useRunSearch({
		useQuery,
		useDisableSearch,
		invalidQueryTooltip
	});
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
	const isMessageView = useIsMessageView();
	const [showAdvanceFilters, setShowAdvanceFilters] = useState(false);
	const { path } = useRouteMatch();
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
