/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { act, renderHook, screen, waitFor } from '@testing-library/react';
import { QueryChip } from '@zextras/carbonio-search-ui';
import * as hooks from '@zextras/carbonio-shell-ui';
import { ErrorSoapBodyResponse } from '@zextras/carbonio-shell-ui';
import { noop } from 'lodash';

import { setupHook } from '@test-setup';
import { createSoapAPIInterceptor } from '@test-utils/network/msw/create-api-interceptor';
import { generateSettings } from '@test-utils/settings/settings-generator';
import { buildSoapErrorResponseBody } from '@test-utils/utils/soap';
import {
	createSoapAPIInterceptorWithError,
	generateConversationFromAPI,
	generateConvMessageFromAPI,
	toSearchConversationHit
} from '__test__/generators/api';
import { generateConversation } from '__test__/generators/generateConversation';
import * as searchSoapApi from 'api/search-soap-api';
import { API_REQUEST_STATUS, TIMEOUTS } from 'constants/index';
import {
	setSearchResultsByConversation,
	useConversationById,
	useMessageById,
	useSearchResults
} from 'store/emails/store';
import { SearchRequest, SearchResponse } from 'types/soap/search';
import { useLoadMoreForSearchSlice, useRunSearch } from 'views/search/search-view-hooks';

const QUERY_PARSE_ERROR_CODE = 'mail.QUERY_PARSE_ERROR';
const SERVICE_FAILURE_CODE = 'service.FAILURE';
const INVALID_QUERY_SNACKBAR_LABEL = 'messages.snackbar.search_invalid_query';
const SEARCH_ERROR_SNACKBAR_LABEL = 'label.error_try_again_search';

const mockSearchFault = (detailCode: string): void => {
	createSoapAPIInterceptor<SearchRequest, ErrorSoapBodyResponse>(
		'Search',
		buildSoapErrorResponseBody({ detailCode })
	);
};

const mockSearchNetworkError = (): void => {
	createSoapAPIInterceptorWithError<SearchRequest>('Search');
};

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

	it('should set invalid query and drop the results of the previous search if API query error', async () => {
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
				detailCode: QUERY_PARSE_ERROR_CODE,
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
		await waitFor(() => {
			expect(result.current.searchResults.status).toBe(API_REQUEST_STATUS.error);
		});
		// the previous results can refer to conversations that are no longer in the store
		expect(result.current.searchResults.conversationListIndex).toEqual([]);
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
			c: [generateConversationFromAPI({ id: '123', su: 'Subject', m: [message] })].map(
				toSearchConversationHit
			),
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
			c: [generateConversationFromAPI({ id: '123', su: 'Subject', m: [message] })].map(
				toSearchConversationHit
			),
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

	describe('when the search fails', () => {
		// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
		const setupSearchHook = (label: string) => {
			vi.spyOn(hooks, 'useUserSettings').mockReturnValue(
				generateSettings({ prefs: { zimbraPrefGroupMailBy: 'conversation' } })
			);
			return setupHook(useRunSearch, {
				initialProps: [
					{
						query: [{ hasAvatar: false, id: '0', label }],
						updateQuery: noop,
						isSharedFolderIncluded: false
					}
				]
			});
		};

		it('should show an error snackbar asking to edit the keywords when the server rejects the query', async () => {
			mockSearchFault(QUERY_PARSE_ERROR_CODE);
			const { result } = setupSearchHook('Re:');

			await act(async () => {
				await result.current.executeSearch(new AbortController().signal);
			});

			expect(await screen.findByText(INVALID_QUERY_SNACKBAR_LABEL)).toBeVisible();
			expect(screen.queryByText(SEARCH_ERROR_SNACKBAR_LABEL)).not.toBeInTheDocument();
		});

		it('should drop the results of the previous search when the server fails for another reason', async () => {
			setSearchResultsByConversation([generateConversation({ id: '1' })], false);
			mockSearchFault(SERVICE_FAILURE_CODE);
			const { result } = setupSearchHook('hello');

			await act(async () => {
				await result.current.executeSearch(new AbortController().signal);
			});

			await waitFor(() => {
				expect(result.current.searchResults.status).toBe(API_REQUEST_STATUS.error);
			});
			expect(result.current.searchResults.conversationListIndex).toEqual([]);
			expect(result.current.isInvalidQuery).toBe(false);
			expect(await screen.findByText(SEARCH_ERROR_SNACKBAR_LABEL)).toBeVisible();
			expect(screen.queryByText(INVALID_QUERY_SNACKBAR_LABEL)).not.toBeInTheDocument();
		});

		it('should drop the results of the previous search when the request does not reach the server', async () => {
			setSearchResultsByConversation([generateConversation({ id: '1' })], false);
			mockSearchNetworkError();
			const { result } = setupSearchHook('hello');

			await act(async () => {
				await result.current.executeSearch(new AbortController().signal);
			});

			await waitFor(() => {
				expect(result.current.searchResults.status).toBe(API_REQUEST_STATUS.error);
			});
			expect(result.current.searchResults.conversationListIndex).toEqual([]);
			expect(await screen.findByText(SEARCH_ERROR_SNACKBAR_LABEL)).toBeVisible();
		});

		it.each([
			[
				'the server rejects the query',
				INVALID_QUERY_SNACKBAR_LABEL,
				(): void => mockSearchFault(QUERY_PARSE_ERROR_CODE)
			],
			[
				'the server fails for another reason',
				SEARCH_ERROR_SNACKBAR_LABEL,
				(): void => mockSearchFault(SERVICE_FAILURE_CODE)
			],
			['the request does not reach the server', SEARCH_ERROR_SNACKBAR_LABEL, mockSearchNetworkError]
		])(
			'should keep the error snackbar for 7 seconds when %s',
			async (_reason, snackbarLabel, mockSearchFailure) => {
				mockSearchFailure();
				const { result } = setupSearchHook('hello');

				await act(async () => {
					await result.current.executeSearch(new AbortController().signal);
				});
				const snackbar = await screen.findByText(snackbarLabel);

				act(() => {
					vi.advanceTimersByTime(TIMEOUTS.SEARCH_ERROR - 500);
				});
				expect(snackbar).toBeVisible();

				act(() => {
					vi.advanceTimersByTime(1000);
				});
				await waitFor(() => {
					expect(screen.queryByText(snackbarLabel)).not.toBeInTheDocument();
				});
			}
		);

		it('should replace the error snackbar, instead of queueing another one, when the search fails again', async () => {
			mockSearchFault(QUERY_PARSE_ERROR_CODE);
			const { result } = setupSearchHook('hello');

			await act(async () => {
				await result.current.executeSearch(new AbortController().signal);
			});
			expect(await screen.findByText(INVALID_QUERY_SNACKBAR_LABEL)).toBeVisible();

			mockSearchFault(SERVICE_FAILURE_CODE);
			await act(async () => {
				await result.current.executeSearch(new AbortController().signal);
			});

			expect(await screen.findByText(SEARCH_ERROR_SNACKBAR_LABEL)).toBeVisible();
			expect(screen.queryByText(INVALID_QUERY_SNACKBAR_LABEL)).not.toBeInTheDocument();
		});

		it('should keep the results, without an error snackbar, when the search is aborted', async () => {
			setSearchResultsByConversation([generateConversation({ id: '1' })], false);
			createSoapAPIInterceptor<SearchRequest, SearchResponse>('Search', { c: [], more: false });
			const { result } = setupSearchHook('hello');
			const controller = new AbortController();

			await act(async () => {
				const search = result.current.executeSearch(controller.signal);
				controller.abort();
				await search;
			});

			expect(result.current.searchResults.conversationListIndex).toEqual(['1']);
			expect(result.current.isInvalidQuery).toBe(false);
			expect(screen.queryByText(SEARCH_ERROR_SNACKBAR_LABEL)).not.toBeInTheDocument();
			expect(screen.queryByText(INVALID_QUERY_SNACKBAR_LABEL)).not.toBeInTheDocument();
		});
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
			c: [conversation].map(toSearchConversationHit),
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
			c: [conversation].map(toSearchConversationHit),
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
				detailCode: QUERY_PARSE_ERROR_CODE,
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
