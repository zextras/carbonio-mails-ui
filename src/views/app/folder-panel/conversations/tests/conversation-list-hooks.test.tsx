/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { act, renderHook } from '@testing-library/react';

import { generateFolder } from '@test-utils/folders/folders-generator';
import { createSoapAPIInterceptor } from '@test-utils/network/msw/create-api-interceptor';
import {
	createSoapAPIInterceptorWithError,
	generateConversationFromAPI
} from '__test__/generators/api';
import * as searchSoapApi from 'api/search-soap-api';
import { API_REQUEST_STATUS } from 'constants/index';
import * as storeHooks from 'store/emails/store';
import { SORT_BY } from 'types/sorting';
import { useLoadMoreForConversationList } from 'views/app/folder-panel/conversations/conversation-list-hooks';

describe('ConversationListHooks', () => {
	it('should load more results for the current folder', async () => {
		const hasMore = false;
		const conversation = generateConversationFromAPI({ id: '1' });
		const searchResponse = {
			c: [conversation],
			more: hasMore
		};
		const interceptor = createSoapAPIInterceptor('Search', searchResponse);
		const loadingMore = { current: false };
		const folder = generateFolder({ id: 'folder-1' });
		const appendConversationsSpy = vi.spyOn(
			storeHooks,
			'appendConversationsToConversationIndexSlice'
		);
		const { result } = renderHook(() =>
			useLoadMoreForConversationList({
				offset: 0,
				sortBy: SORT_BY.dateDesc,
				limit: 20,
				hasMore: true,
				loadingMore,
				folderId: folder.id,
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
			query: `inId:"${folder.id}"`,
			recip: '2',
			sortBy: SORT_BY.dateDesc,
			types: 'conversation',
			wantContent: 'full'
		});
		expect(appendConversationsSpy).toHaveBeenCalledWith(expect.any(Array), 0, hasMore);
		expect(loadingMore.current).toBe(false);
	});

	it('should handle API errors gracefully', async () => {
		const searchResponse = {
			Fault: {}
		};
		const updateConversationsResultsLoadingStatusSpy = vi.spyOn(
			storeHooks,
			'updateConversationsResultsLoadingStatus'
		);
		const interceptor = createSoapAPIInterceptor('Search', searchResponse);
		const loadingMore = { current: false };
		const { result } = renderHook(() =>
			useLoadMoreForConversationList({
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

		expect(updateConversationsResultsLoadingStatusSpy).toHaveBeenCalledWith(
			API_REQUEST_STATUS.error
		);
		expect(loadingMore.current).toBe(false);
	});

	it('should handle 500 gracefully', async () => {
		const updateConversationsResultsLoadingStatusSpy = vi.spyOn(
			storeHooks,
			'updateConversationsResultsLoadingStatus'
		);
		const interceptor = createSoapAPIInterceptorWithError('Search');
		const loadingMore = { current: false };
		const { result } = renderHook(() =>
			useLoadMoreForConversationList({
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

		expect(updateConversationsResultsLoadingStatusSpy).toHaveBeenCalledWith(
			API_REQUEST_STATUS.error
		);
		expect(loadingMore.current).toBe(false);
	});

	it('should not load more results if hasMore is false', async () => {
		const searchSpy = vi.spyOn(searchSoapApi, 'searchSoapApi');
		const loadingMore = { current: false };
		const { result } = renderHook(() =>
			useLoadMoreForConversationList({
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
			useLoadMoreForConversationList({
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
