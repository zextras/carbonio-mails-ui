/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryChip } from '@zextras/carbonio-search-ui';
import * as hooks from '@zextras/carbonio-shell-ui';
import { ErrorSoapBodyResponse } from '@zextras/carbonio-shell-ui';
import { noop } from 'lodash';

import { createSoapAPIInterceptor } from '@test-utils/network/msw/create-api-interceptor';
import { generateSettings } from '@test-utils/settings/settings-generator';
import { buildSoapErrorResponseBody } from '@test-utils/utils/soap';
import { generateConversationFromAPI, generateConvMessageFromAPI } from '__test__/generators/api';
import { generateConversation } from '__test__/generators/generateConversation';
import * as searchSoapApi from 'api/search-soap-api';
import { API_REQUEST_STATUS } from 'constants/index';
import {
	setSearchResultsByConversation,
	useConversationById,
	useMessageById,
	useSearchResults
} from 'store/emails/store';
import { SearchRequest, SearchResponse } from 'types/soap/search';
import { useLoadMoreForSearchSlice, useRunSearch } from 'views/search/search-view-hooks';

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
		vi.spyOn(hooks, 'useUserSettings').mockReturnValue(settings);
		const interceptor = createSoapAPIInterceptor<SearchRequest, SearchResponse>('Search', {
			c: [],
			more: false
		});

		const { result } = renderHook(() =>
			useRunSearch({
				query: [queryChip],
				updateQuery: noop,
				isSharedFolderIncluded: false
			})
		);

		await act(async () => {
			await result.current.executeSearch(new AbortController().signal);
		});

		await act(async () => {
			await interceptor;
		});

		await waitFor(() => {
			expect(result.current.searchResults.conversationListIndex.length).toBe(0);
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
		vi.spyOn(hooks, 'useUserSettings').mockReturnValue(settings);
		const interceptor = createSoapAPIInterceptor<SearchRequest, SearchResponse>('Search', {
			more: false
		});

		const { result } = renderHook(() =>
			useRunSearch({
				query: [queryChip],
				updateQuery: noop,
				isSharedFolderIncluded: false
			})
		);

		await act(async () => {
			await result.current.executeSearch(new AbortController().signal);
		});

		await act(async () => {
			await interceptor;
		});

		await waitFor(() => {
			expect(result.current.searchResults.conversationListIndex.length).toBe(0);
		});
	});

	it('should set invalid query if API query error', async () => {
		setSearchResultsByConversation([generateConversation({ id: '1' })], false);
		const settings = generateSettings({
			prefs: {
				zimbraPrefGroupMailBy: 'conversation'
			}
		});
		vi.spyOn(hooks, 'useUserSettings').mockReturnValue(settings);
		// eslint-disable-next-line @typescript-eslint/ban-types
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
				isSharedFolderIncluded: false
			})
		);

		await act(async () => {
			await result.current.executeSearch(new AbortController().signal);
		});

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
		vi.spyOn(hooks, 'useUserSettings').mockReturnValue(settings);
		// eslint-disable-next-line @typescript-eslint/ban-types
		const useDisableSearch = (): [boolean, Function] => [false, noop];
		const message = generateConvMessageFromAPI({ id: '1' });
		const searchResponse = {
			c: [generateConversationFromAPI({ id: '123', su: 'Subject', m: [message] })],
			more: false
		};
		createSoapAPIInterceptor<SearchRequest, SearchResponse>('Search', searchResponse);

		const { result } = renderHook(() =>
			useRunSearch({
				query: [
					{
						hasAvatar: false,
						id: '0',
						label: 'hello there'
					}
				],
				updateQuery: noop,
				isSharedFolderIncluded: false
			})
		);

		await act(async () => {
			await result.current.executeSearch(new AbortController().signal);
		});

		await waitFor(() => {
			expect(renderHook(() => useConversationById('123')).result.current).toBeDefined();
		});

		await waitFor(() => {
			expect(renderHook(() => useMessageById('1')).result.current).toBeDefined();
		});
	});

	it('should execute the search again when executeSearch is called', async () => {
		const settings = generateSettings({
			prefs: {
				zimbraPrefGroupMailBy: 'conversation'
			}
		});
		// eslint-disable-next-line @typescript-eslint/ban-types
		const useDisableSearch = (): [boolean, Function] => [false, noop];
		vi.spyOn(hooks, 'useUserSettings').mockReturnValue(settings);
		const message = generateConvMessageFromAPI({ id: '1' });
		const searchResponse = {
			c: [generateConversationFromAPI({ id: '123', su: 'Subject', m: [message] })],
			more: false
		};
		const interceptor = createSoapAPIInterceptor<SearchRequest, SearchResponse>(
			'Search',
			searchResponse
		);

		const { result } = renderHook(() =>
			useRunSearch({
				query: [
					{
						hasAvatar: false,
						id: '0',
						label: 'hello there'
					}
				],
				updateQuery: noop,
				isSharedFolderIncluded: false
			})
		);

		await act(async () => {
			await result.current.executeSearch(new AbortController().signal);
		});

		await act(async () => {
			await interceptor;
		});

		expect(renderHook(() => useConversationById('123')).result.current).toBeDefined();
		expect(renderHook(() => useMessageById('1')).result.current).toBeDefined();

		const newInterceptor = createSoapAPIInterceptor<SearchRequest, SearchResponse>('Search', {
			c: [],
			more: false
		});

		await act(async () => {
			await result.current.executeSearch(new AbortController().signal);
			await newInterceptor;
		});

		expect(renderHook(() => useConversationById('123')).result.current).toBeUndefined();
		expect(renderHook(() => useMessageById('1')).result.current).toBeUndefined();
	});
});

describe('useLoadMore', () => {
	let loadingMore: { current: boolean };
	beforeEach(() => {
		loadingMore = { current: false };
	});
	it('should correcly handle response with both conversations and messages', async () => {
		const message = generateConvMessageFromAPI({ id: '1' });
		const conversation = generateConversationFromAPI({ id: '123', su: 'Subject', m: [message] });
		const searchResponse = {
			c: [conversation],
			m: [message],
			more: false
		};
		const interceptor = createSoapAPIInterceptor<SearchRequest, SearchResponse>(
			'Search',
			searchResponse
		);

		const { result } = renderHook(() =>
			useLoadMoreForSearchSlice({
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
		const conversation = generateConversationFromAPI({ id: '123', su: 'Subject', m: [message] });
		const searchResponse = {
			c: [conversation],
			more: false
		};
		const interceptor = createSoapAPIInterceptor<SearchRequest, SearchResponse>(
			'Search',
			searchResponse
		);

		const { result } = renderHook(() =>
			useLoadMoreForSearchSlice({
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
			useLoadMoreForSearchSlice({
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
			useLoadMoreForSearchSlice({
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
		const mockedSearch = vi.spyOn(searchSoapApi, 'searchSoapApi');

		const { result } = renderHook(() =>
			useLoadMoreForSearchSlice({
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
		const mockedSearch = vi.spyOn(searchSoapApi, 'searchSoapApi');

		const { result } = renderHook(() =>
			useLoadMoreForSearchSlice({
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
