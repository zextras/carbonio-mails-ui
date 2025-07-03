/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { renderHook, waitFor } from '@testing-library/react';
import { useUserSettings } from '@zextras/carbonio-shell-ui';

import { createSoapAPIInterceptor } from '@test-utils/network/msw/create-api-interceptor';
import { API_REQUEST_STATUS, LIST_LIMIT } from 'constants/index';
import { parseMessageSortingOptions } from 'helpers/sorting';
import { useConversationListByFolder } from 'hooks/use-conversations-list-by-folder';
import { searchEmailStoreAction } from 'store/emails/actions/search-action';
import {
	updateConversationsResultsLoadingStatus,
	useConversationIndexSlice,
	useConversationsIdsByFolder
} from 'store/emails/store';
import { SearchRequest, SearchResponse } from 'types/index.d';

jest.mock('../../store/emails/actions/search-action', () => ({
	searchEmailStoreAction: jest.fn()
}));
jest.mock('../../store/emails/store', () => ({
	updateConversationsResultsLoadingStatus: jest.fn(),
	useConversationIndexSlice: jest.fn(),
	useConversationsIdsByFolder: jest.fn()
}));
jest.mock('../../helpers/sorting', () => ({
	parseMessageSortingOptions: jest.fn()
}));

describe('useConversationListByFolder', () => {
	const mockPrefs = {
		zimbraPrefLocale: 'en_US',
		zimbraPrefSortOrder: 'dateDesc'
	};

	beforeEach(() => {
		(useUserSettings as jest.Mock).mockReturnValue({ prefs: mockPrefs });
		(useConversationIndexSlice as jest.Mock).mockReturnValue({});
		(useConversationsIdsByFolder as jest.Mock).mockReturnValue([]);
		(parseMessageSortingOptions as jest.Mock).mockReturnValue({
			sortType: 'date',
			sortDirection: 'DESC'
		});
		(searchEmailStoreAction as jest.Mock).mockResolvedValue({});
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	it('should fetch conversations on mount with correct parameters', async () => {
		const folderId = '123';
		renderHook(() => useConversationListByFolder(folderId));

		expect(searchEmailStoreAction).toHaveBeenCalledWith({
			folderId,
			limit: LIST_LIMIT.INITIAL_LIMIT,
			types: 'conversation',
			offset: 0,
			locale: mockPrefs.zimbraPrefLocale,
			sortBy: 'dateDESC',
			abortSignal: expect.any(AbortSignal)
		});
		expect(updateConversationsResultsLoadingStatus).toHaveBeenCalledWith(
			API_REQUEST_STATUS.pending
		);
		await waitFor(() => {
			expect(updateConversationsResultsLoadingStatus).toHaveBeenCalledWith(
				API_REQUEST_STATUS.fulfilled
			);
		});
	});

	it('should fetch conversations on folderId change', async () => {
		const { rerender } = renderHook((folderId: string) => useConversationListByFolder(folderId), {
			initialProps: '123'
		});

		expect(searchEmailStoreAction).toHaveBeenCalledTimes(1);

		rerender('456');

		expect(searchEmailStoreAction).toHaveBeenCalledTimes(2);
	});

	it('should abort previous request on folderId change', async () => {
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

		const { rerender } = renderHook((folderId: string) => useConversationListByFolder(folderId), {
			initialProps: '123'
		});
		rerender('456');

		expect(mockAbort).toHaveBeenCalledTimes(1);
	});

	it('should handle search error', async () => {
		(searchEmailStoreAction as jest.Mock).mockRejectedValue(new Error('Test error'));
		const folderId = '123';
		renderHook(() => useConversationListByFolder(folderId));

		expect(updateConversationsResultsLoadingStatus).toHaveBeenCalledWith(
			API_REQUEST_STATUS.pending
		);
		await waitFor(() => {
			expect(updateConversationsResultsLoadingStatus).toHaveBeenCalledWith(
				API_REQUEST_STATUS.error
			);
		});
		await waitFor(() => {
			expect(updateConversationsResultsLoadingStatus).toHaveBeenCalledWith(
				API_REQUEST_STATUS.fulfilled
			);
		});
	});

	it('should return correct conversationIndexSlice', () => {
		const mockConversationIndexSlice = { some: 'data' };
		const mockConversationListIndex = [1, 2, 3];
		(useConversationIndexSlice as jest.Mock).mockReturnValue(mockConversationIndexSlice);
		(useConversationsIdsByFolder as jest.Mock).mockReturnValue(mockConversationListIndex);

		const folderId = '123';
		const { result } = renderHook(() => useConversationListByFolder(folderId));

		expect(result.current.conversationIndexSlice).toEqual({
			...mockConversationIndexSlice,
			conversationListIndex: mockConversationListIndex
		});
	});

	it('should use correct sortBy based on preferences', () => {
		const folderId = '123';
		const { rerender } = renderHook((id) => useConversationListByFolder(id), {
			initialProps: folderId
		});
		expect(searchEmailStoreAction).toHaveBeenCalledWith(
			expect.objectContaining({ sortBy: 'dateDESC' })
		);

		(parseMessageSortingOptions as jest.Mock).mockReturnValue({
			sortType: 'subject',
			sortDirection: 'ASC'
		});
		rerender(folderId);
		expect(searchEmailStoreAction).toHaveBeenCalledWith(
			expect.objectContaining({ sortBy: 'subjectASC' })
		);
	});
});
