/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { act } from 'react';

import { renderHook, waitFor } from '@testing-library/react';
import { ErrorSoapBodyResponse } from '@zextras/carbonio-shell-ui';
import { useFolderStore } from '@zextras/carbonio-ui-commons';

import { API_REQUEST_STATUS } from '../../constants';
import { parseMessageSortingOptions } from '../../helpers/sorting';
import {
	resetMessagesAndPopulatedItems,
	updateMessagesResultsLoadingStatus
} from '../../store/emails/store';
import { SearchRequest, SearchResponse } from '../../types';
import { useFetchMessagesByFolder } from '../use-fetch-messages-by-folder';
import { generateFolder } from '@test-utils/folders/folders-generator';
import { createSoapAPIInterceptor } from '@test-utils/network/msw/create-api-interceptor';
import { buildSoapErrorResponseBody } from '@test-utils/utils/soap';

const folder = generateFolder({ id: '2' });
jest.mock('../../store/emails/store', () => ({
	...jest.requireActual('../../store/emails/store'),
	setMessagesInEmailStore: jest.fn(),
	resetMessagesAndPopulatedItems: jest.fn(),
	updateMessagesResultsLoadingStatus: jest.fn(),
	useMessagesIdsByFolder: jest.fn(),
	useMessagesSlice: jest.fn()
}));
jest.mock('../../helpers/sorting', () => ({
	parseMessageSortingOptions: jest.fn()
}));

describe('useMessageListByFolder', () => {
	it('should make search call with correct params', async () => {
		const searchInterceptor = createSoapAPIInterceptor<SearchRequest>('Search');
		(parseMessageSortingOptions as jest.Mock).mockReturnValue({
			sortType: 'date',
			sortDirection: 'Desc'
		});

		useFolderStore.setState({ folders: { folderId: folder } });

		renderHook(() => useFetchMessagesByFolder(folder.id));

		await act(async () => {
			expect(await searchInterceptor).toEqual({
				_jsns: 'urn:zimbraMail',
				fullConversation: 1,
				limit: 100,
				locale: {
					_content: 'en'
				},
				needExp: 1,
				offset: 0,
				query: 'inId:"2"',
				recip: '2',
				sortBy: 'dateDesc',
				types: 'message',
				wantContent: 'full'
			});
		});
	});

	it('should use correct sortBy based on preferences', async () => {
		const firstInterceptor = createSoapAPIInterceptor<SearchRequest>('Search');
		useFolderStore.setState({ folders: { folderId: folder } });
		(parseMessageSortingOptions as jest.Mock).mockReturnValue({
			sortType: 'date',
			sortDirection: 'Desc'
		});

		const { rerender } = renderHook((id) => useFetchMessagesByFolder(id), {
			initialProps: folder.id
		});
		await act(async () => {
			expect((await firstInterceptor).sortBy).toEqual('dateDesc');
		});

		(parseMessageSortingOptions as jest.Mock).mockReturnValue({
			sortType: 'subject',
			sortDirection: 'Asc'
		});

		const secondInterceptor = createSoapAPIInterceptor<SearchRequest>('Search');
		rerender(folder.id);
		expect((await secondInterceptor).sortBy).toEqual('subjectAsc');
	});

	it('should handle query parse errors', async () => {
		createSoapAPIInterceptor<SearchRequest, ErrorSoapBodyResponse>('Search', {
			Fault: {
				Detail: {
					Error: { Code: 'QUERY_PARSE_ERROR', Trace: 'trace' }
				},
				Reason: { Text: 'reason' },
				Code: { Value: 'QUERY_PARSE_ERROR' }
			}
		});

		renderHook(() => useFetchMessagesByFolder(folder.id));

		await waitFor(() => {
			expect(updateMessagesResultsLoadingStatus).toHaveBeenCalledWith(API_REQUEST_STATUS.error);
		});
	});

	it('should reset messages if searchResponse has no messages', async () => {
		createSoapAPIInterceptor<SearchRequest, SearchResponse>('Search', {
			more: false
		});
		renderHook(() => useFetchMessagesByFolder(folder.id));

		await waitFor(() => {
			expect(resetMessagesAndPopulatedItems).toHaveBeenCalled();
		});
		await waitFor(() => {
			expect(updateMessagesResultsLoadingStatus).toHaveBeenCalledWith(API_REQUEST_STATUS.fulfilled);
		});
	});

	it('should call updateMessagesResultsLoadingStatus messages if the API call fails', async () => {
		const response = buildSoapErrorResponseBody();
		createSoapAPIInterceptor('Search', response);
		renderHook(() => useFetchMessagesByFolder(folder.id));

		await waitFor(() => {
			expect(updateMessagesResultsLoadingStatus).toHaveBeenCalledWith(API_REQUEST_STATUS.error);
		});
	});

	it('should abort previous requests on folder change', async () => {
		createSoapAPIInterceptor<SearchRequest, SearchResponse>('Search', {
			more: false
		});

		const mockAbort = jest.fn();
		const mockSignal = {};

		const controller = {
			abort: mockAbort,
			signal: mockSignal
		} as unknown as AbortController;

		jest.spyOn(global, 'AbortController').mockImplementation(() => controller);

		const { rerender } = renderHook(useFetchMessagesByFolder, {
			initialProps: folder.id
		});

		rerender('3');

		expect(mockAbort).toHaveBeenCalled();
	});
});
