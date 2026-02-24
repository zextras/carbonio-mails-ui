/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { renderHook, waitFor } from '@testing-library/react';
import { useUserSettings } from '@zextras/carbonio-shell-ui';
import type { Mock } from 'vitest';

import { parseMessageSortingOptions } from '../../helpers/parseMessageSortingOptions';
import { API_REQUEST_STATUS } from 'constants/index';
import { useConversationListByFolder } from 'hooks/use-conversations-list-by-folder';
import { searchEmailStoreAction } from 'store/emails/actions/search-action';
import {
	updateConversationsResultsLoadingStatus,
	useConversationIndexSlice,
	useConversationsIdsByFolder
} from 'store/emails/store';

vi.mock('store/emails/actions/search-action', () => ({
	searchEmailStoreAction: vi.fn()
}));
vi.mock('store/emails/store', () => ({
	updateConversationsResultsLoadingStatus: vi.fn(),
	useConversationIndexSlice: vi.fn(),
	useConversationsIdsByFolder: vi.fn()
}));
vi.mock('helpers/sorting', () => ({
	getFilterQuery: vi.fn().mockReturnValue('mockQuery')
}));
vi.mock('@zextras/carbonio-shell-ui', () => ({
	useUserSettings: vi.fn()
}));

// TODO: refactor this test and remove all mocks
describe('useConversationListByFolder', () => {
	const mockPrefs = { zimbraPrefLocale: 'en_US', zimbraPrefSortOrder: 'dateDesc' };

	beforeEach(() => {
		(useUserSettings as Mock).mockReturnValue({ prefs: mockPrefs });
		(useConversationIndexSlice as Mock).mockReturnValue({});
		(useConversationsIdsByFolder as Mock).mockReturnValue([]);
		(parseMessageSortingOptions as Mock).mockReturnValue({
			sortType: 'date',
			sortDirection: 'DESC'
		});
		(searchEmailStoreAction as Mock).mockResolvedValue({});
	});

	afterEach(() => {
		vi.restoreAllMocks();
		vi.clearAllMocks();
	});

	it('fetches conversations on mount with correct parameters', async () => {
		const folderId = '123';
		renderHook(() => useConversationListByFolder(folderId));

		expect(searchEmailStoreAction).toHaveBeenCalledWith(
			expect.objectContaining({
				abortSignal: expect.any(AbortSignal),
				limit: 100,
				locale: 'en_US',
				offset: 0,
				query: 'mockQuery',
				sortBy: 'dateDESC',
				types: 'conversation'
			})
		);
		expect(updateConversationsResultsLoadingStatus).toHaveBeenCalledWith(
			API_REQUEST_STATUS.pending
		);

		await waitFor(() => {
			expect(updateConversationsResultsLoadingStatus).toHaveBeenCalledWith(
				API_REQUEST_STATUS.fulfilled
			);
		});
	});

	it('refetches conversations when folderId changes', () => {
		const { rerender } = renderHook((id: string) => useConversationListByFolder(id), {
			initialProps: '123'
		});

		expect(searchEmailStoreAction).toHaveBeenCalledTimes(1);

		rerender('456');
		expect(searchEmailStoreAction).toHaveBeenCalledTimes(2);
	});

	it('aborts previous request when folderId changes', () => {
		const controller = new AbortController();
		const abortSpy = vi.spyOn(controller, 'abort');
		vi.spyOn(global, 'AbortController').mockImplementation(() => controller);

		const { rerender } = renderHook((id: string) => useConversationListByFolder(id), {
			initialProps: '123'
		});

		rerender('456');
		expect(abortSpy).toHaveBeenCalledTimes(1);
	});

	it('handles search errors correctly', async () => {
		(searchEmailStoreAction as Mock).mockRejectedValue(new Error('Test error'));

		renderHook(() => useConversationListByFolder('123'));

		expect(updateConversationsResultsLoadingStatus).toHaveBeenCalledWith(
			API_REQUEST_STATUS.pending
		);

		await waitFor(() => {
			expect(updateConversationsResultsLoadingStatus).toHaveBeenCalledWith(
				API_REQUEST_STATUS.error
			);
		});
	});

	it('returns correct conversationIndexSlice', () => {
		const mockIndexSlice = { some: 'data' };
		const mockListIndex = [1, 2, 3];
		(useConversationIndexSlice as Mock).mockReturnValue(mockIndexSlice);
		(useConversationsIdsByFolder as Mock).mockReturnValue(mockListIndex);

		const { result } = renderHook(() => useConversationListByFolder('123'));

		expect(result.current.conversationIndexSlice).toEqual({
			...mockIndexSlice,
			conversationListIndex: mockListIndex
		});
	});

	it('uses correct sortBy based on preferences', () => {
		const folderId = '123';
		const { rerender } = renderHook((id) => useConversationListByFolder(id), {
			initialProps: folderId
		});

		expect(searchEmailStoreAction).toHaveBeenCalledWith(
			expect.objectContaining({ sortBy: 'dateDESC' })
		);

		(parseMessageSortingOptions as Mock).mockReturnValue({
			sortType: 'subject',
			sortDirection: 'ASC'
		});
		(useUserSettings as Mock).mockReturnValue({
			prefs: { ...mockPrefs, zimbraPrefSortOrder: 'subjectAsc' }
		});

		rerender(folderId);

		expect(searchEmailStoreAction).toHaveBeenCalledWith(
			expect.objectContaining({ sortBy: 'subjectASC' })
		);
	});
});
