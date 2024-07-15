/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { ReactElement } from 'react';

import { act, screen, waitFor } from '@testing-library/react';
import * as hooks from '@zextras/carbonio-shell-ui';
import {
	AccountSettings,
	ErrorSoapBodyResponse,
	QueryChip,
	SearchViewProps
} from '@zextras/carbonio-shell-ui';
import { noop } from 'lodash';

import { createSoapAPIInterceptor } from '../../../carbonio-ui-commons/test/mocks/network/msw/create-api-interceptor';
import { generateSettings } from '../../../carbonio-ui-commons/test/mocks/settings/settings-generator';
import { buildSoapErrorResponseBody } from '../../../carbonio-ui-commons/test/mocks/utils/soap';
import { setupTest } from '../../../carbonio-ui-commons/test/test-setup';
import * as search from '../../../store/actions/search';
import { generateStore } from '../../../tests/generators/store';
import {
	SearchRequest,
	SearchResponse,
	SoapConversation,
	SoapIncompleteMessage,
	SoapMailMessage
} from '../../../types';
import SearchView from '../search-view';
//
// jest.mock('react-router-dom', () => ({
// 	...jest.requireActual('react-router-dom'),
// 	useParams: jest.fn()
// }));

function getSoapConversationMessage(messageId: string, conversationId: string): SoapMailMessage {
	return {
		id: messageId,
		cid: conversationId,
		e: [],
		su: 'conversations Subject',
		s: 71116,
		l: '2',
		f: 'au',
		fr: 'fragment',
		mp: [],
		d: 1717752296000
	};
}

function getSoapMessage(
	messageId: string,
	initialData?: Partial<SoapIncompleteMessage>
): SoapIncompleteMessage {
	return {
		id: messageId,
		cid: '1',
		e: [],
		su: 'message Subject',
		s: 71116,
		l: '2',
		f: 'au',
		fr: 'fragment',
		mp: [],
		d: 1717752296000,
		...initialData
	};
}

function getSoapConversation(id: string): SoapConversation {
	return {
		id,
		n: 1,
		u: 1,
		f: 'flag',
		tn: 'tag names',
		d: 123,
		m: [],
		e: [],
		su: 'conversations Subject',
		fr: 'fragment'
	};
}
describe('SearchView', () => {
	describe('view by conversations', () => {
		beforeEach(() => {
			jest
				.spyOn(hooks, 'useUserSettings')
				.mockReturnValue(generateSettings({ prefs: { zimbraPrefGroupMailBy: 'conversation' } }));
		});
		it('should display label "Results for" when soap API fulfilled', async () => {
			const store = generateStore();
			const searchInterceptor = createSoapAPIInterceptor<SearchRequest, SearchResponse>('Search', {
				c: [getSoapConversation('123')],
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
			await searchInterceptor;

			expect(await screen.findByText('label.results_for')).toBeInTheDocument();
		});

		it('should display conversation subject when soap API fulfilled and settings is "display by conversation"', async () => {
			const store = generateStore();
			createSoapAPIInterceptor<SearchRequest, SearchResponse>('Search', {
				c: [getSoapConversation('123')],
				more: false
			});
			const queryChip: QueryChip = {
				hasAvatar: false,
				id: '0',
				label: 'ciao'
			};
			const customSettings: Partial<AccountSettings> = {
				prefs: {
					zimbraPrefGroupMailBy: 'conversation'
				}
			};
			const settings = generateSettings(customSettings);
			jest.spyOn(hooks, 'useUserSettings').mockReturnValue(settings);

			const resultsHeader = (props: { label: string }): ReactElement => <>{props.label}</>;
			const searchViewProps: SearchViewProps = {
				useQuery: () => [[queryChip], noop],
				useDisableSearch: () => [false, noop],
				ResultsHeader: resultsHeader
			};

			setupTest(<SearchView {...searchViewProps} />, {
				store
			});
			const conversation = await screen.findByText('conversations Subject');
			expect(conversation).toBeInTheDocument();
		});

		it('should display the number of messages in a conversation when soap API fulfilled', async () => {
			const store = generateStore();
			const defaultConversation = getSoapConversation('123');
			const message1 = getSoapConversationMessage('100', '123');
			const message2 = getSoapConversationMessage('200', '123');

			const conversation = { ...defaultConversation, n: 2, m: [message1, message2] };
			createSoapAPIInterceptor<SearchRequest, SearchResponse>('Search', {
				c: [conversation],
				more: false
			});
			const queryChip: QueryChip = {
				hasAvatar: false,
				id: '0',
				label: 'ciao'
			};
			const customSettings: Partial<AccountSettings> = {
				prefs: {
					zimbraPrefGroupMailBy: 'conversation'
				}
			};
			const settings = generateSettings(customSettings);
			jest.spyOn(hooks, 'useUserSettings').mockReturnValue(settings);

			const resultsHeader = (props: { label: string }): ReactElement => <>{props.label}</>;
			const searchViewProps: SearchViewProps = {
				useQuery: () => [[queryChip], noop],
				useDisableSearch: () => [false, noop],
				ResultsHeader: resultsHeader
			};

			setupTest(<SearchView {...searchViewProps} />, {
				store
			});
			expect(await screen.findByText('conversations Subject')).toBeInTheDocument();
			const chevron = await screen.findByTestId(`ToggleExpand`);
			const badge = await screen.findByTestId(`conversation-messages-count-${conversation.id}`);
			expect(chevron).toBeInTheDocument();
			expect(badge).toBeInTheDocument();
			expect(badge).toHaveTextContent('2');
		});
	});

	describe('view by messages', () => {
		it('should display messages when soap API fulfilled and settings is "display by message"', async () => {
			const store = generateStore();
			createSoapAPIInterceptor<SearchRequest, SearchResponse>('Search', {
				m: [
					getSoapMessage('10', { su: 'message 1 Subject' }),
					getSoapMessage('11', { su: 'message 2 Subject' })
				],
				more: false
			});
			const queryChip: QueryChip = {
				hasAvatar: false,
				id: '0',
				label: 'ciao'
			};
			const customSettings: Partial<AccountSettings> = {
				prefs: {
					zimbraPrefGroupMailBy: 'message'
				}
			};
			const settings = generateSettings(customSettings);
			jest.spyOn(hooks, 'useUserSettings').mockReturnValue(settings);

			// (useParams as jest.Mock).mockReturnValue({ folderId: '2', conversationId: '1' });

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
			expect(await screen.findByTestId('invisible-message-10')).toBeInTheDocument();
			expect(await screen.findByTestId('invisible-message-11')).toBeInTheDocument();
		});
	});

	it('should display a disabled Advanced Filters button when SearchDisabled is true', async () => {
		const store = generateStore();

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
		const spySearch = jest.spyOn(search, 'search');
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
		expect(spySearch).not.toBeCalled();
	});

	it('should call setSearchDisabled button if Search API fails with mail.QUERY_PARSE_ERROR', async () => {
		const store = generateStore();
		const interceptor = createSoapAPIInterceptor<SearchRequest, ErrorSoapBodyResponse>(
			'Search',
			buildSoapErrorResponseBody({
				detailCode: 'mail.QUERY_PARSE_ERROR',
				reason: 'Failed to execute search'
			})
		);
		const resultsHeader = (props: { label: string }): ReactElement => <>{props.label}</>;
		const setSearchDisabled = jest.fn();
		const queryChip: QueryChip = {
			hasAvatar: false,
			id: '0',
			label: 'ciao'
		};
		const searchViewProps: SearchViewProps = {
			useQuery: () => [[queryChip], noop],
			useDisableSearch: () => [false, setSearchDisabled],
			ResultsHeader: resultsHeader
		};

		setupTest(<SearchView {...searchViewProps} />, {
			store
		});
		await interceptor;
		await waitFor(() => expect(setSearchDisabled).toBeCalled());
	});

	it('should not call setSearchDisabled button if Search API fails with another error', async () => {
		const store = generateStore();
		const interceptor = createSoapAPIInterceptor<SearchRequest, ErrorSoapBodyResponse>(
			'Search',
			buildSoapErrorResponseBody({
				detailCode: 'Other code',
				reason: 'Failed to execute search'
			})
		);
		const resultsHeader = (props: { label: string }): ReactElement => <>{props.label}</>;
		const setSearchDisabled = jest.fn();
		const queryChip: QueryChip = {
			hasAvatar: false,
			id: '0',
			label: 'ciao'
		};
		const searchViewProps: SearchViewProps = {
			useQuery: () => [[queryChip], noop],
			useDisableSearch: () => [false, setSearchDisabled],
			ResultsHeader: resultsHeader
		};

		setupTest(<SearchView {...searchViewProps} />, {
			store
		});

		await interceptor;
		act(() => {
			jest.advanceTimersByTime(10_000);
		});

		expect(setSearchDisabled).not.toBeCalled();
	});
});
