/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { act } from 'react';

import { ErrorSoapBodyResponse } from '@zextras/carbonio-shell-ui/lib/types/network/soap';

import { generateFolder } from '../../carbonio-ui-commons/test/mocks/folders/folders-generator';
import { createSoapAPIInterceptor } from '../../carbonio-ui-commons/test/mocks/network/msw/create-api-interceptor';
import { setupHook } from '../../carbonio-ui-commons/test/test-setup';
import { API_REQUEST_STATUS } from '../../constants';
import {
	resetMessagesAndPopulatedItems,
	updateMessagesResultsLoadingStatus
} from '../../store/zustand/emails/store';
import { SearchRequest, SearchResponse } from '../../types';
import { useMessageListByFolder } from '../use-message-list-by-folder';

const folder = generateFolder({ id: '2' });
jest.mock('../../store/zustand/emails/store', () => ({
	setMessagesInEmailStore: jest.fn(),
	resetMessagesAndPopulatedItems: jest.fn(),
	updateMessagesResultsLoadingStatus: jest.fn(),
	useMessagesIdsByFolder: jest.fn(),
	useMessagesSlice: jest.fn()
}));

describe('useMessageListByFolder', () => {
	it('should make search call with correct params', async () => {
		const searchInterceptor = createSoapAPIInterceptor<SearchRequest>('Search');

		setupHook(useMessageListByFolder, {
			initialProps: [folder]
		});

		const requestParams = await searchInterceptor;

		await act(async () => {
			jest.advanceTimersByTime(0);
		});

		expect(requestParams).toEqual({
			_jsns: 'urn:zimbraMail',
			fullConversation: 1,
			limit: 100,
			locale: {
				_content: 'en'
			},
			needExp: 1,
			offset: 0,
			query: 'inId:"2"',
			recip: '0',
			sortBy: 'dateDesc',
			types: 'message',
			wantContent: 'full'
		});
	});

	it('should handle query parse errors', async () => {
		const searchInterceptor = createSoapAPIInterceptor<SearchRequest, ErrorSoapBodyResponse>(
			'Search',
			{
				Fault: {
					Detail: {
						Error: { Code: 'QUERY_PARSE_ERROR', Trace: 'trace' }
					},
					Reason: { Text: 'reason' },
					Code: { Value: 'QUERY_PARSE_ERROR' }
				}
			}
		);

		setupHook(useMessageListByFolder, { initialProps: [folder] });

		await searchInterceptor;

		await act(async () => {
			jest.advanceTimersByTime(0);
		});

		expect(updateMessagesResultsLoadingStatus).toHaveBeenCalledWith(API_REQUEST_STATUS.error);
	});

	it('should reset messages if searchResponse has no messages', async () => {
		const searchInterceptor = createSoapAPIInterceptor<SearchRequest, SearchResponse>('Search', {
			more: false
		});
		setupHook(() => useMessageListByFolder(folder));

		await searchInterceptor;

		await act(async () => {
			jest.advanceTimersByTime(0);
		});

		expect(resetMessagesAndPopulatedItems).toHaveBeenCalled();
		expect(updateMessagesResultsLoadingStatus).toHaveBeenCalledWith(API_REQUEST_STATUS.fulfilled);
	});

	it('should abort previous requests on folder change', async () => {
		const searchInterceptor = createSoapAPIInterceptor<SearchRequest, SearchResponse>('Search', {
			more: false
		});

		const mockAbort = jest.fn();
		const mockSignal = {};

		const controller = {
			abort: mockAbort,
			signal: mockSignal
		} as unknown as AbortController;

		jest.spyOn(global, 'AbortController').mockImplementation(() => controller);

		const { rerender } = setupHook(useMessageListByFolder, {
			initialProps: [folder]
		});

		await searchInterceptor;

		await act(async () => {
			jest.advanceTimersByTime(0);
		});

		rerender([generateFolder({ id: '3' })]);

		expect(mockAbort).toHaveBeenCalled();
	});
});
