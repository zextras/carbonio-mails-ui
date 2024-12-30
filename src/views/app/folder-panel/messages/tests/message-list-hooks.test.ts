/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { act } from 'react';

import { renderHook } from '@testing-library/react';

import * as searchSoapApi from '../../../../../api/search';
import { createSoapAPIInterceptor } from '../../../../../carbonio-ui-commons/test/mocks/network/msw/create-api-interceptor';
import { API_REQUEST_STATUS } from '../../../../../constants';
import * as storeHooks from '../../../../../store/zustand/emails/store';
import {
	createSoapAPIInterceptorWithError,
	generateCompleteMessageFromAPI
} from '../../../../../tests/generators/api';
import { useLoadMoreForMessageList } from '../message-list-hooks';

describe('useLoadMoreForMessagesSlice', () => {
	it('should load more results and append messages to the slice', async () => {
		const searchResponse = {
			m: [generateCompleteMessageFromAPI()],
			more: false
		};
		const appendMessagesSpy = jest.spyOn(storeHooks, 'appendMessagesToMessagesSlice');
		const interceptor = createSoapAPIInterceptor('Search', searchResponse);
		const loadingMore = { current: false };
		const { result } = renderHook(() =>
			useLoadMoreForMessageList({
				offset: 0,
				sortBy: 'date',
				limit: 20,
				hasMore: true,
				loadingMore,
				folderId: 'inbox'
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
			recip: '0',
			sortBy: 'date',
			types: 'message',
			wantContent: 'full'
		});
		expect(appendMessagesSpy).toHaveBeenCalledWith(expect.any(Array), 0);
		expect(loadingMore.current).toBe(false);
	});

	it('should handle API errors gracefully', async () => {
		const searchResponse = {
			Fault: {}
		};
		const updateMessagesResultsLoadingStatusSpy = jest.spyOn(
			storeHooks,
			'updateMessagesResultsLoadingStatus'
		);
		const interceptor = createSoapAPIInterceptor('Search', searchResponse);
		const loadingMore = { current: false };
		const { result } = renderHook(() =>
			useLoadMoreForMessageList({
				offset: 0,
				sortBy: 'date',
				limit: 20,
				hasMore: true,
				loadingMore,
				folderId: 'inbox'
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
		const updateMessagesResultsLoadingStatusSpy = jest.spyOn(
			storeHooks,
			'updateMessagesResultsLoadingStatus'
		);
		const interceptor = createSoapAPIInterceptorWithError('Search');
		const loadingMore = { current: false };
		const { result } = renderHook(() =>
			useLoadMoreForMessageList({
				offset: 0,
				sortBy: 'date',
				limit: 20,
				hasMore: true,
				loadingMore,
				folderId: 'inbox'
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
		const searchSpy = jest.spyOn(searchSoapApi, 'searchSoapApi');
		const loadingMore = { current: false };
		const { result } = renderHook(() =>
			useLoadMoreForMessageList({
				offset: 0,
				sortBy: 'date',
				limit: 20,
				hasMore: false,
				loadingMore,
				folderId: 'inbox'
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

		const searchSpy = jest.spyOn(searchSoapApi, 'searchSoapApi');
		const { result } = renderHook(() =>
			useLoadMoreForMessageList({
				offset: 0,
				sortBy: 'date',
				limit: 20,
				hasMore: true,
				loadingMore,
				folderId: 'inbox'
			})
		);

		await act(async () => {
			await result.current();
		});

		expect(searchSpy).not.toHaveBeenCalled();
		expect(loadingMore.current).toBe(true);
	});
});
