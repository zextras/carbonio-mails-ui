/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { ReactElement } from 'react';

import { screen } from '@testing-library/react';
import { ErrorSoapBodyResponse, QueryChip, SearchViewProps } from '@zextras/carbonio-shell-ui';
import { noop } from 'lodash';

import { createSoapAPIInterceptor } from '../../../carbonio-ui-commons/test/mocks/network/msw/create-api-interceptor';
import { setupTest } from '../../../carbonio-ui-commons/test/test-setup';
import * as searchByQuery from '../../../store/actions/searchByQuery';
import { generateStore } from '../../../tests/generators/store';
import { SearchRequest, SearchResponse } from '../../../types';
import SearchView from '../search-view';

describe('SearchView', () => {
	it('should display Results for when soap API fulfilled', async () => {
		const store = generateStore();
		createSoapAPIInterceptor<SearchRequest, SearchResponse>('Search', {
			c: [
				{
					id: '123',
					n: 1,
					u: 1,
					f: 'flag',
					tn: 'tag names',
					d: 123,
					m: [],
					e: [],
					su: 'Subject',
					fr: 'fragment'
				}
			],
			more: false
		});
		const queryChip: QueryChip = {
			hasAvatar: false,
			id: '0',
			label: 'ciao'
		};
		const resultsHeader = (props: { label: string }): ReactElement => <>{props.label}</>;
		const searchViewProps: SearchViewProps = {
			useQuery: () => [[queryChip], noop],
			useDisableSearch: () => [false, noop],
			ResultsHeader: resultsHeader
		};

		setupTest(<SearchView {...searchViewProps} />, {
			store
		});

		expect(await screen.findByText('label.results_for')).toBeInTheDocument();
	});

	it('should display a disabled Advanced Filters button when SearchDisabled is true', async () => {
		const store = generateStore();
		createSoapAPIInterceptor<SearchRequest, SearchResponse>('Search', {
			c: [
				{
					id: '123',
					n: 1,
					u: 1,
					f: 'flag',
					tn: 'tag names',
					d: 123,
					m: [],
					e: [],
					su: 'Subject',
					fr: 'fragment'
				}
			],
			more: false
		});
		const resultsHeader = (props: { label: string }): ReactElement => <>{props.label}</>;
		const searchViewProps: SearchViewProps = {
			useQuery: () => [[], noop],
			useDisableSearch: () => [true, noop],
			ResultsHeader: resultsHeader
		};

		setupTest(<SearchView {...searchViewProps} />, {
			store
		});

		const advancedFiltersButton = screen.getByRole('button', {
			name: /label\.single_advanced_filter/i
		});
		expect(advancedFiltersButton).toBeVisible();
		expect(advancedFiltersButton).toBeDisabled();
	});

	it('should not call search API if query empty', async () => {
		const store = generateStore();
		const spySearchByQuery = jest.spyOn(searchByQuery, 'searchByQuery');
		const resultsHeader = (props: { label: string }): ReactElement => <>{props.label}</>;
		const searchViewProps: SearchViewProps = {
			useQuery: () => [[], noop],
			useDisableSearch: () => [false, noop],
			ResultsHeader: resultsHeader
		};

		setupTest(<SearchView {...searchViewProps} />, {
			store
		});

		const advancedFiltersButton = screen.getByRole('button', {
			name: /label\.single_advanced_filter/i
		});
		expect(advancedFiltersButton).toBeVisible();
		expect(advancedFiltersButton).toBeEnabled();
		expect(spySearchByQuery).not.toBeCalled();
	});

	it('should call setSearchDisabled button if Search API fails with mail.QUERY_PARSE_ERROR', async () => {
		const store = generateStore();
		const interceptor = createSoapAPIInterceptor<SearchRequest, ErrorSoapBodyResponse>('Search', {
			Fault: {
				Reason: { Text: 'Failed to execute search' },
				Detail: {
					Error: { Code: 'mail.QUERY_PARSE_ERROR', Detail: 'Failed' }
				}
			}
		});
		const resultsHeader = (props: { label: string }): ReactElement => <>{props.label}</>;
		const setSearchDisabled = jest.fn();
		const searchViewProps: SearchViewProps = {
			useQuery: () => [[], noop],
			useDisableSearch: () => [false, setSearchDisabled],
			ResultsHeader: resultsHeader
		};

		setupTest(<SearchView {...searchViewProps} />, {
			store
		});
		await interceptor;
		expect(setSearchDisabled).toBeCalled();
	});
});
