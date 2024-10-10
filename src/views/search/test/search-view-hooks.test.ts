/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { act, renderHook, waitFor } from '@testing-library/react';
import * as hooks from '@zextras/carbonio-shell-ui';
import { ErrorSoapBodyResponse, QueryChip } from '@zextras/carbonio-shell-ui';
import { noop } from 'lodash';

import * as searchSoapApi from '../../../api/search';
import { createSoapAPIInterceptor } from '../../../carbonio-ui-commons/test/mocks/network/msw/create-api-interceptor';
import { generateSettings } from '../../../carbonio-ui-commons/test/mocks/settings/settings-generator';
import { buildSoapErrorResponseBody } from '../../../carbonio-ui-commons/test/mocks/utils/soap';
import { API_REQUEST_STATUS } from '../../../constants';
import {
	setSearchResultsByConversation,
	useConversationById,
	useMessageById,
	useSearchResults
} from '../../../store/zustand/search/store';
import { generateConvMessageFromAPI } from '../../../tests/generators/api';
import { generateConversation } from '../../../tests/generators/generateConversation';
import { SearchRequest, SearchResponse, SoapConversation } from '../../../types';
import { useRunSearch, useLoadMore } from '../search-view-hooks';

describe('search view hooks', () => {
	it('should reset conversations list when api result empty', async () => {
		setSearchResultsByConversation([generateConversation({ id: '1' })], false);
		const queryChip: QueryChip = {
			hasAvatar: false,
			id: '0',
			label: 'ciao'
		};
		const settings = generateSettings({
			prefs: {
				zimbraPrefGroupMailBy: 'conversation'
			}
		});
		jest.spyOn(hooks, 'useUserSettings').mockReturnValue(settings);
		const interceptor = createSoapAPIInterceptor<SearchRequest, SearchResponse>('Search', {
			c: [],
			more: false
		});
		// eslint-disable-next-line @typescript-eslint/ban-types
		const useDisableSearch = (): [boolean, Function] => [false, noop];

		const { result } = renderHook(() =>
			useRunSearch({
				query: [queryChip],
				updateQuery: noop,
				useDisableSearch,
				invalidQueryTooltip: 'INVALID',
				isSharedFolderIncluded: false
			})
		);
		await act(async () => {
			await interceptor;
		});

		await waitFor(() => {
			expect(result.current.searchResults.conversationIds.size).toBe(0);
		});
	});

	it('should reset conversations list when no conversation field in API response', async () => {
		setSearchResultsByConversation([generateConversation({ id: '1' })], false);
		const queryChip: QueryChip = {
			hasAvatar: false,
			id: '0',
			label: 'ciao'
		};
		const settings = generateSettings({
			prefs: {
				zimbraPrefGroupMailBy: 'conversation'
			}
		});
		jest.spyOn(hooks, 'useUserSettings').mockReturnValue(settings);
		const interceptor = createSoapAPIInterceptor<SearchRequest, SearchResponse>('Search', {
			more: false
		});
		// eslint-disable-next-line @typescript-eslint/ban-types
		const useDisableSearch = (): [boolean, Function] => [false, noop];

		const { result } = renderHook(() =>
			useRunSearch({
				query: [queryChip],
				updateQuery: noop,
				useDisableSearch,
				invalidQueryTooltip: 'INVALID',
				isSharedFolderIncluded: false
			})
		);

		await act(async () => {
			await interceptor;
		});

		await waitFor(() => {
			expect(result.current.searchResults.conversationIds.size).toBe(0);
		});
	});

	it('should set invalid query if API query error', async () => {
		setSearchResultsByConversation([generateConversation({ id: '1' })], false);
		const settings = generateSettings({
			prefs: {
				zimbraPrefGroupMailBy: 'conversation'
			}
		});
		jest.spyOn(hooks, 'useUserSettings').mockReturnValue(settings);
		// eslint-disable-next-line @typescript-eslint/ban-types
		const useDisableSearch = (): [boolean, Function] => [false, noop];
		const interceptor = createSoapAPIInterceptor<SearchRequest, ErrorSoapBodyResponse>(
			'Search',
			buildSoapErrorResponseBody({
				detailCode: 'mail.QUERY_PARSE_ERROR',
				reason: 'Failed to execute search'
			})
		);

		const { result } = renderHook(() =>
			useRunSearch({
				query: [
					{
						hasAvatar: false,
						id: '0',
						label: 'ciao'
					}
				],
				updateQuery: noop,
				useDisableSearch,
				invalidQueryTooltip: 'INVALID',
				isSharedFolderIncluded: false
			})
		);

		await act(async () => {
			await interceptor;
		});

		await waitFor(() => {
			expect(result.current.isInvalidQuery).toBe(true);
		});
	});

	it('should populate messages in the store after search', async () => {
		const settings = generateSettings({
			prefs: {
				zimbraPrefGroupMailBy: 'conversation'
			}
		});
		jest.spyOn(hooks, 'useUserSettings').mockReturnValue(settings);
		// eslint-disable-next-line @typescript-eslint/ban-types
		const useDisableSearch = (): [boolean, Function] => [false, noop];
		const message = generateConvMessageFromAPI({ id: '1' });
		const searchResponse = {
			// eslint-disable-next-line @typescript-eslint/no-use-before-define
			c: [conversationFromAPI({ id: '123', su: 'Subject', m: [message] })],
			more: false
		};
		const interceptor = createSoapAPIInterceptor<SearchRequest, SearchResponse>(
			'Search',
			searchResponse
		);

		renderHook(() =>
			useRunSearch({
				query: [
					{
						hasAvatar: false,
						id: '0',
						label: 'hello there'
					}
				],
				updateQuery: noop,
				useDisableSearch,
				invalidQueryTooltip: 'INVALID',
				isSharedFolderIncluded: false
			})
		);

		await act(async () => {
			await interceptor;
		});

		await waitFor(() => {
			expect(renderHook(() => useConversationById('123')).result.current).toBeDefined();
		});

		await waitFor(() => {
			expect(renderHook(() => useMessageById('1')).result.current).not.toBeDefined();
		});
	});
});

function conversationFromAPI(params: Partial<SoapConversation> = {}): SoapConversation {
	return {
		id: '123',
		n: 1,
		u: 1,
		f: 'flag',
		tn: 'tag names',
		d: 123,
		m: [],
		e: [],
		su: 'Subject',
		fr: 'fragment',
		...params
	};
}

describe('useLoadMore', () => {
	let loadingMore: { current: boolean };
	beforeEach(() => {
		loadingMore = { current: false };
	});
	it('should correcly handle response with both conversations and messages', async () => {
		const message = generateConvMessageFromAPI({ id: '1' });
		const searchResponse = {
			c: [conversationFromAPI({ id: '123', su: 'Subject', m: [message] })],
			m: [message],
			more: false
		};
		const interceptor = createSoapAPIInterceptor<SearchRequest, SearchResponse>(
			'Search',
			searchResponse
		);

		const { result } = renderHook(() =>
			useLoadMore({
				query: 'test query',
				offset: 0,
				hasMore: true,
				loadingMore,
				types: 'conversation'
			})
		);

		renderHook(() => result.current());

		await act(async () => {
			await interceptor;
		});

		expect(loadingMore.current).toBe(false);

		expect(renderHook(() => useConversationById('123'))).toBeDefined();
		expect(renderHook(() => useMessageById('1')).result.current).toBeDefined();
	});

	it('should correcly handle response with  conversations only', async () => {
		const message = generateConvMessageFromAPI({ id: '1' });
		const searchResponse = {
			c: [conversationFromAPI({ id: '123', su: 'Subject', m: [message] })],
			more: false
		};
		const interceptor = createSoapAPIInterceptor<SearchRequest, SearchResponse>(
			'Search',
			searchResponse
		);

		const { result } = renderHook(() =>
			useLoadMore({
				query: 'test query',
				offset: 0,
				hasMore: true,
				loadingMore,
				types: 'conversation'
			})
		);

		renderHook(() => result.current());

		await act(async () => {
			await interceptor;
		});

		expect(loadingMore.current).toBe(false);

		expect(renderHook(() => useConversationById('123'))).toBeDefined();
		expect(renderHook(() => useMessageById('1')).result.current).toBeDefined();
	});

	it('should correcly handle response with messages only', async () => {
		const message = generateConvMessageFromAPI({ id: '1' });
		const searchResponse = {
			m: [message],
			more: false
		};
		const interceptor = createSoapAPIInterceptor<SearchRequest, SearchResponse>(
			'Search',
			searchResponse
		);

		const { result } = renderHook(() =>
			useLoadMore({
				query: 'test query',
				offset: 0,
				hasMore: true,
				loadingMore,
				types: 'conversation'
			})
		);

		renderHook(() => result.current());

		await act(async () => {
			await interceptor;
		});

		expect(loadingMore.current).toBe(false);

		expect(renderHook(() => useMessageById('1')).result.current).toBeDefined();
	});

	it('should correcly update updateSearchResultsLoadingStatus when the API call fails', async () => {
		const interceptor = createSoapAPIInterceptor<SearchRequest, ErrorSoapBodyResponse>(
			'Search',
			buildSoapErrorResponseBody({
				detailCode: 'mail.QUERY_PARSE_ERROR',
				reason: 'Failed to execute search'
			})
		);

		const { result } = renderHook(() =>
			useLoadMore({
				query: 'test query',
				offset: 0,
				hasMore: true,
				loadingMore,
				types: 'conversation'
			})
		);

		renderHook(() => result.current());

		await act(async () => {
			await interceptor;
		});

		expect(loadingMore.current).toBe(false);

		expect(renderHook(() => useSearchResults()).result.current.status).toBe(
			API_REQUEST_STATUS.error
		);
	});

	it('should not call the API if hasMore is false', async () => {
		const mockedSearch = jest.spyOn(searchSoapApi, 'searchSoapApi');

		const { result } = renderHook(() =>
			useLoadMore({
				query: 'test query',
				offset: 0,
				hasMore: false,
				loadingMore,
				types: 'conversation'
			})
		);
		renderHook(() => result.current());
		expect(loadingMore.current).toBe(false);
		expect(mockedSearch).not.toHaveBeenCalled();
	});

	it('should not call the API if loadingMore is true', async () => {
		loadingMore.current = true;
		const mockedSearch = jest.spyOn(searchSoapApi, 'searchSoapApi');

		const { result } = renderHook(() =>
			useLoadMore({
				query: 'test query',
				offset: 0,
				hasMore: false,
				loadingMore,
				types: 'conversation'
			})
		);
		renderHook(() => result.current());
		expect(loadingMore.current).toBe(true);
		expect(mockedSearch).not.toHaveBeenCalled();
	});
});
