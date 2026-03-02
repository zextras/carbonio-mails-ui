/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { act } from 'react';

import { renderHook } from '@testing-library/react';

import { createSoapAPIInterceptor } from '@test-utils/network/msw/create-api-interceptor';
import {
	createSoapAPIInterceptorWithError,
	generateCompleteMessageFromAPI
} from '__test__/generators/api';
import * as searchSoapApi from 'api/search-soap-api';
import { API_REQUEST_STATUS } from 'constants/index';
import * as storeHooks from 'store/emails/store';
import { SORT_BY } from 'types/sorting';
import { useLoadMoreForMessageList } from 'views/app/folder-panel/messages/message-list-hooks';

describe('useLoadMoreForMessagesSlice', () => {
	it('should load more results and append messages to the slice', async () => {
		const searchResponse = {
			m: [generateCompleteMessageFromAPI()],
			more: false
		};
		const appendMessagesSpy = vi.spyOn(storeHooks, 'appendMessagesToMessagesSlice');
		const interceptor = createSoapAPIInterceptor('Search', searchResponse);
		const loadingMore = { current: false };
		const { result } = renderHook(() =>
			useLoadMoreForMessageList({
				offset: 0,
				sortBy: SORT_BY.dateDesc,
				limit: 20,
				hasMore: true,
				loadingMore,
				folderId: 'inbox',
				filterType: undefined
			})
		);

		await act(async () => {
			await result.current();
		});

		const request = await interceptor;

		expect(request).toEqual({
			_jsns: 'urn:zimbraMail',
			fullConversation: 1,
			limit: 20,
			needExp: 1,
			offset: 0,
			query: 'inId:"inbox"',
			recip: '2',
			sortBy: SORT_BY.dateDesc,
			types: 'message',
			wantContent: 'full'
		});
		expect(appendMessagesSpy).toHaveBeenCalledWith(expect.any(Array), 0, false);
		expect(loadingMore.current).toBe(false);
	});

	it('should handle API errors gracefully', async () => {
		const searchResponse = {
			Fault: {}
		};
		const updateMessagesResultsLoadingStatusSpy = vi.spyOn(
			storeHooks,
			'updateMessagesResultsLoadingStatus'
		);
		const interceptor = createSoapAPIInterceptor('Search', searchResponse);
		const loadingMore = { current: false };
		const { result } = renderHook(() =>
			useLoadMoreForMessageList({
				offset: 0,
				sortBy: SORT_BY.dateDesc,
				limit: 20,
				hasMore: true,
				loadingMore,
				folderId: 'inbox',
				filterType: undefined
			})
		);

		await act(async () => {
			await result.current();
		});

		await interceptor;

		expect(updateMessagesResultsLoadingStatusSpy).toHaveBeenCalledWith(API_REQUEST_STATUS.error);
		expect(loadingMore.current).toBe(false);
	});

	it('should handle 500 errors gracefully', async () => {
		const updateMessagesResultsLoadingStatusSpy = vi.spyOn(
			storeHooks,
			'updateMessagesResultsLoadingStatus'
		);
		const interceptor = createSoapAPIInterceptorWithError('Search');
		const loadingMore = { current: false };
		const { result } = renderHook(() =>
			useLoadMoreForMessageList({
				offset: 0,
				sortBy: SORT_BY.dateDesc,
				limit: 20,
				hasMore: true,
				loadingMore,
				folderId: 'inbox',
				filterType: undefined
			})
		);

		await act(async () => {
			await result.current();
		});

		await interceptor;

		expect(updateMessagesResultsLoadingStatusSpy).toHaveBeenCalledWith(API_REQUEST_STATUS.error);
		expect(loadingMore.current).toBe(false);
	});

	it('should not load more results if hasMore is false', async () => {
		const searchSpy = vi.spyOn(searchSoapApi, 'searchSoapApi');
		const loadingMore = { current: false };
		const { result } = renderHook(() =>
			useLoadMoreForMessageList({
				offset: 0,
				sortBy: SORT_BY.dateDesc,
				limit: 20,
				hasMore: false,
				loadingMore,
				folderId: 'inbox',
				filterType: undefined
			})
		);

		await act(async () => {
			await result.current();
		});

		expect(searchSpy).not.toHaveBeenCalled();
		expect(loadingMore.current).toBe(false);
	});

	it('should not load more results if already loading', async () => {
		const loadingMore = { current: true };

		const searchSpy = vi.spyOn(searchSoapApi, 'searchSoapApi');
		const { result } = renderHook(() =>
			useLoadMoreForMessageList({
				offset: 0,
				sortBy: SORT_BY.dateDesc,
				limit: 20,
				hasMore: true,
				loadingMore,
				folderId: 'inbox',
				filterType: undefined
			})
		);

		await act(async () => {
			await result.current();
		});

		expect(searchSpy).not.toHaveBeenCalled();
		expect(loadingMore.current).toBe(true);
	});
});
