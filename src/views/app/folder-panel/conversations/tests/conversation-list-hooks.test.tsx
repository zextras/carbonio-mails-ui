/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { renderHook, act } from '@testing-library/react';

import * as searchSoapApi from '../../../../../api/search';
import { generateFolder } from '../../../../../carbonio-ui-commons/test/mocks/folders/folders-generator';
import { createSoapAPIInterceptor } from '../../../../../carbonio-ui-commons/test/mocks/network/msw/create-api-interceptor';
import { API_REQUEST_STATUS } from '../../../../../constants';
import * as storeHooks from '../../../../../store/zustand/emails/store';
import { generateConversationFromAPI } from '../../../../../tests/generators/api';
import { useLoadMoreForConversationList } from '../conversation-list-hooks';

describe('ConversationListHooks', () => {
	it('should load more results for the current folder', async () => {
		const hasMore = 0;
		const conversation = generateConversationFromAPI({ id: '1' });
		const searchResponse = {
			c: [conversation],
			more: hasMore
		};
		const interceptor = createSoapAPIInterceptor('Search', searchResponse);
		const loadingMore = { current: false };
		const folder = generateFolder({ id: 'folder-1' });
		const appendConversationsSpy = jest.spyOn(
			storeHooks,
			'appendConversationsToConversationIndexSlice'
		);
		const { result } = renderHook(() =>
			useLoadMoreForConversationList({
				offset: 0,
				sortBy: 'date',
				limit: 20,
				hasMore: true,
				loadingMore,
				folderId: folder.id
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
			recip: '0',
			sortBy: 'date',
			types: 'conversation',
			wantContent: 'full'
		});
		expect(appendConversationsSpy).toHaveBeenCalledWith(expect.any(Array), hasMore);
		expect(loadingMore.current).toBe(false);
	});

	it('should handle API errors gracefully', async () => {
		const searchResponse = {
			Fault: {}
		};
		const updateConversationsResultsLoadingStatusSpy = jest.spyOn(
			storeHooks,
			'updateConversationsResultsLoadingStatus'
		);
		const interceptor = createSoapAPIInterceptor('Search', searchResponse);
		const loadingMore = { current: false };
		const { result } = renderHook(() =>
			useLoadMoreForConversationList({
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

		expect(updateConversationsResultsLoadingStatusSpy).toHaveBeenCalledWith(
			API_REQUEST_STATUS.error
		);
		expect(loadingMore.current).toBe(false);
	});

	it('should not load more results if hasMore is false', async () => {
		const searchSpy = jest.spyOn(searchSoapApi, 'searchSoapApi');
		const loadingMore = { current: false };
		const { result } = renderHook(() =>
			useLoadMoreForConversationList({
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
			useLoadMoreForConversationList({
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
