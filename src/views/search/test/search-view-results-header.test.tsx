/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { screen, waitFor } from '@testing-library/react';
import type { QueryChip, ResultsHeaderProps, SearchViewProps } from '@zextras/carbonio-search-ui';
import * as hooks from '@zextras/carbonio-shell-ui';
import { ErrorSoapBodyResponse } from '@zextras/carbonio-shell-ui';
import { noop } from 'lodash';

import { setupTest } from '@test-setup';
import { createSoapAPIInterceptor } from '@test-utils/network/msw/create-api-interceptor';
import { generateSettings } from '@test-utils/settings/settings-generator';
import { buildSoapErrorResponseBody } from '@test-utils/utils/soap';
import { generateConversation } from '__test__/generators/generateConversation';
import { setConversationsInEmailStore, setSearchResultsByConversation } from 'store/emails/store';
import { SearchRequest, SearchResponse } from 'types/soap/search';
import SearchView from 'views/search/search-view';

const ResultsHeader = ({ label, labelType }: ResultsHeaderProps): React.JSX.Element => (
	<div data-testid="results-header" data-label-type={labelType ?? 'normal'}>
		{label}
	</div>
);

const setupSearchView = (query: Array<QueryChip>): void => {
	vi.spyOn(hooks, 'useUserSettings').mockReturnValue(
		generateSettings({ prefs: { zimbraPrefGroupMailBy: 'conversation' } })
	);
	const searchViewProps: SearchViewProps = {
		useQuery: () => [query, noop],
		ResultsHeader,
		useDisableSearch: () => [false, noop]
	};
	setupTest(<SearchView {...searchViewProps} />);
};

const INVALID_QUERY_SNACKBAR_LABEL = 'messages.snackbar.search_invalid_query';
const SEARCH_ERROR_SNACKBAR_LABEL = 'label.error_try_again_search';

const toKeywordChip = (label: string): QueryChip => ({ id: label, label, hasAvatar: false });

const expectResultsHeaderType = (labelType: string): void => {
	expect(screen.getByTestId('results-header')).toHaveAttribute('data-label-type', labelType);
};

describe('SearchView results header', () => {
	it('should show an error, and not the results of the previous search, when the server rejects the query', async () => {
		// a search found a conversation of another folder, then the user opened the Inbox
		setSearchResultsByConversation([generateConversation({ id: 'other-folder' })], false);
		setConversationsInEmailStore([generateConversation({ id: 'inbox' })], false);
		createSoapAPIInterceptor<SearchRequest, ErrorSoapBodyResponse>(
			'Search',
			buildSoapErrorResponseBody({ detailCode: 'mail.QUERY_PARSE_ERROR' })
		);

		setupSearchView([toKeywordChip('Re:')]);

		expect(await screen.findByText('label.search_invalid_query')).toBeVisible();
		expectResultsHeaderType('error');
		await waitFor(() => {
			expect(screen.getByText(INVALID_QUERY_SNACKBAR_LABEL)).toBeVisible();
		});
		expect(screen.queryByText(SEARCH_ERROR_SNACKBAR_LABEL)).not.toBeInTheDocument();
		expect(screen.queryByTestId('invisible-conversation-other-folder')).not.toBeInTheDocument();
	});

	it('should show an error header and snackbar when the search fails for another reason', async () => {
		createSoapAPIInterceptor<SearchRequest, ErrorSoapBodyResponse>(
			'Search',
			buildSoapErrorResponseBody({ detailCode: 'service.FAILURE' })
		);

		setupSearchView([toKeywordChip('hello')]);

		expect(await screen.findByText('label.search_failed')).toBeVisible();
		expectResultsHeaderType('error');
		await waitFor(() => {
			expect(screen.getByText(SEARCH_ERROR_SNACKBAR_LABEL)).toBeVisible();
		});
		expect(screen.queryByText(INVALID_QUERY_SNACKBAR_LABEL)).not.toBeInTheDocument();
	});

	it('should search for a term made only of special characters and warn that they are ignored', async () => {
		const interceptor = createSoapAPIInterceptor<SearchRequest, SearchResponse>('Search', {
			more: false
		});

		setupSearchView([toKeywordChip('cheques'), toKeywordChip('+')]);

		const request = await interceptor;
		expect(request.query).toBe('cheques "+"');
		expect(await screen.findByText('label.invalid_query')).toBeVisible();
		expectResultsHeaderType('warning');
		// the search completed, without results
		expect(await screen.findByText('displayer.search_list_title1')).toBeVisible();
		expect(screen.queryByText(INVALID_QUERY_SNACKBAR_LABEL)).not.toBeInTheDocument();
		expect(screen.queryByText(SEARCH_ERROR_SNACKBAR_LABEL)).not.toBeInTheDocument();
	});

	// the keywords typed in the search bar or added in the advanced filters have a label and no value
	it.each([
		['the search bar or the advanced filters', toKeywordChip('Fine?')],
		['a suggestion', { ...toKeywordChip('Fine?'), value: 'Fine?' }]
	])(
		'should warn that special characters are ignored for a keyword from %s',
		async (_source, chip) => {
			createSoapAPIInterceptor<SearchRequest, SearchResponse>('Search', { more: false });

			setupSearchView([chip]);

			expect(await screen.findByText('label.invalid_query')).toBeVisible();
			expectResultsHeaderType('warning');
		}
	);

	it('should not warn about special characters for a keyword without them', async () => {
		createSoapAPIInterceptor<SearchRequest, SearchResponse>('Search', { more: false });

		setupSearchView([toKeywordChip('Fine')]);

		expect(await screen.findByText('label.results_for')).toBeVisible();
		expectResultsHeaderType('normal');
	});
});
