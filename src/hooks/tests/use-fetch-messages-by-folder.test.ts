/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { act } from 'react';

import { renderHook, waitFor } from '@testing-library/react';
import { ErrorSoapBodyResponse } from '@zextras/carbonio-shell-ui';
import { useFolderStore } from '@zextras/carbonio-ui-commons';
import type { Mock } from 'vitest';

import { parseMessageSortingOptions } from '../../helpers/parseMessageSortingOptions';
import { generateFolder } from '@test-utils/folders/folders-generator';
import { createSoapAPIInterceptor } from '@test-utils/network/msw/create-api-interceptor';
import { API_REQUEST_STATUS } from 'constants/index';
import { useFetchMessagesByFolder } from 'hooks/use-fetch-messages-by-folder';
import {
	resetMessagesAndPopulatedItems,
	updateMessagesResultsLoadingStatus
} from 'store/emails/store';
import { SearchRequest, SearchResponse } from 'types/soap/search';

const folder = generateFolder({ id: '2' });
vi.mock('../../store/emails/store', async () => ({
	...(await vi.importActual('../../store/emails/store')),
	setMessagesInEmailStore: vi.fn(),
	resetMessagesAndPopulatedItems: vi.fn(),
	updateMessagesResultsLoadingStatus: vi.fn(),
	useMessagesIdsByFolder: vi.fn(),
	useMessagesSlice: vi.fn()
}));
vi.mock('../../helpers/sorting', async () => ({
	...(await vi.importActual('../../helpers/sorting')),
	getFilterQuery: vi.fn().mockReturnValue('inId:"2"')
}));
vi.mock('../../helpers/parseMessageSortingOptions');

describe('useMessageListByFolder', () => {
	it('should make search call with correct params', async () => {
		const searchInterceptor = createSoapAPIInterceptor<SearchRequest>('Search');
		(parseMessageSortingOptions as Mock).mockReturnValue({
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

	// FIXME: failing test
	it.skip('should abort previous requests on folder change', async () => {
		(parseMessageSortingOptions as Mock).mockReturnValue({
			sortType: 'date',
			sortDirection: 'Desc'
		});

		createSoapAPIInterceptor<SearchRequest, SearchResponse>('Search', { more: false });

		const mockAbort = vi.fn();
		const mockSignal = {} as AbortSignal;

		const controller = {
			abort: mockAbort,
			signal: mockSignal
		} as unknown as AbortController;

		vi.spyOn(global, 'AbortController').mockImplementation(() => controller);

		const { rerender } = renderHook(useFetchMessagesByFolder, {
			initialProps: folder.id
		});

		await rerender('3');

		expect(mockAbort).toHaveBeenCalled();
	});
});
