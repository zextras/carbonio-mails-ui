/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { Suspense, useCallback, useEffect, useMemo, useState } from 'react';

import { Container, Spinner } from '@zextras/carbonio-design-system';
import type { SearchViewProps } from '@zextras/carbonio-search-ui';
import { setAppContext, t, useUserSettings } from '@zextras/carbonio-shell-ui';
import { FormProvider, useForm } from 'react-hook-form';
import { Route, Routes } from 'react-router-dom';

import { AdvancedFilterModal } from './advanced-filter-modal';
import { SearchConversationList } from './list/conversation/search-conversation-list';
import { SearchMessageList } from './list/message/search-message-list';
import SearchPanel from './panel/search-panel';
import { useIsMessageView, useRunSearch } from './search-view-hooks';
import { useUpdateView } from '../../carbonio-ui-commons/hooks/use-update-view';
import { API_REQUEST_STATUS } from '../../constants';
import { FormValues, Query } from './types/types';
import { getAdvancedFiltersDefaultValues } from './utils';
import { resetSearchAndPopulatedItems } from '../../store/emails/store';

const SearchView = ({
	useDisableSearch,
	useQuery,
	ResultsHeader
}: SearchViewProps): React.JSX.Element => {
	useUpdateView();

	const [query, updateQuery] = useQuery();
	const settings = useUserSettings();
	const includeSharedItemsInSearchDefaultPref =
		settings.prefs.zimbraPrefIncludeSharedItemsInSearch === 'TRUE';

	const defaultValues: FormValues = useMemo(
		() => getAdvancedFiltersDefaultValues(query as any, includeSharedItemsInSearchDefaultPref),
		[query, includeSharedItemsInSearchDefaultPref]
	);

	const methods = useForm<FormValues>({ defaultValues });
	const isMessageView = useIsMessageView();
	const [showAdvanceFilters, setShowAdvanceFilters] = useState(false);

	const invalidQueryTooltip = useMemo(
		() => t('label.invalid_query', 'Unable to parse the search query, clear it and retry'),
		[]
	);

	const { watch, setValue } = useForm<FormValues>();

	const isSharedFolderIncluded = watch('isSharedFolderIncluded');

	const [count, setCount] = useState(0);

	useEffect(() => {
		methods.reset(defaultValues);
	}, [defaultValues, methods, query]);

	useEffect(() => {
		setAppContext({ isMessageView, count, setCount });
	}, [count, isMessageView]);

	const { searchDisabled, searchResults, isInvalidQuery, queryToString, executeSearch } =
		useRunSearch({
			query,
			updateQuery,
			useDisableSearch,
			invalidQueryTooltip,
			isSharedFolderIncluded
		});

	const resultLabelType = isInvalidQuery ? 'warning' : undefined;

	const resultLabel = useMemo(() => {
		if (isInvalidQuery) {
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
	}, [isInvalidQuery, searchResults.status, query, invalidQueryTooltip]);

	const loading = searchResults.status === API_REQUEST_STATUS.pending;

	const onModalConfirm = useCallback(
		({
			query: searchQuery,
			includeSharedFolders
		}: {
			query: Query;
			includeSharedFolders: boolean;
		}) => {
			setValue('isSharedFolderIncluded', includeSharedFolders);
			updateQuery(searchQuery);
		},
		[setValue, updateQuery]
	);

	useEffect(() => {
		const controller = new AbortController();
		if (query.length > 0) {
			executeSearch(controller.signal);
		} else {
			resetSearchAndPopulatedItems();
			setValue('isSharedFolderIncluded', includeSharedItemsInSearchDefaultPref);
		}
		return () => {
			controller.abort();
		};
	}, [executeSearch, query, setValue, includeSharedItemsInSearchDefaultPref]);

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
					<Routes>
						<Route
							path={`:type?/:itemId?`}
							element={
								isMessageView ? (
									<SearchMessageList
										searchDisabled={searchDisabled}
										searchResults={searchResults.messageListIndex}
										query={queryToString}
										loading={loading}
										setShowAdvanceFilters={setShowAdvanceFilters}
										isInvalidQuery={isInvalidQuery}
										invalidQueryTooltip={invalidQueryTooltip}
										hasMore={searchResults.more}
									/>
								) : (
									<SearchConversationList
										searchDisabled={searchDisabled}
										searchResults={searchResults.conversationListIndex}
										query={queryToString}
										loading={loading}
										setShowAdvanceFilters={setShowAdvanceFilters}
										isInvalidQuery={isInvalidQuery}
										invalidQueryTooltip={invalidQueryTooltip}
										hasMore={searchResults.more}
									/>
								)
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

			{showAdvanceFilters && (
				<FormProvider {...methods}>
					<AdvancedFilterModal
						onSearchConfirm={onModalConfirm}
						onClose={(): void => setShowAdvanceFilters(false)}
						includeSharedItemsInSearchDefaultPref={includeSharedItemsInSearchDefaultPref}
					/>
				</FormProvider>
			)}
		</>
	);
};

export default SearchView;
