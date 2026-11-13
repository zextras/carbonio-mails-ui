/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { act } from 'react';

import { renderHook } from '@testing-library/react';

import { createSoapAPIInterceptor } from '@test-utils/network/msw/create-api-interceptor';
import { MailboxRefreshedEvent } from 'event-bus/events/mailbox-refreshed';
import { useConversationListByFolder } from 'hooks/use-conversations-list-by-folder';
import { SearchRequest } from 'types/soap/search';

vi.mock('../../helpers/sorting', async () => ({
	...(await vi.importActual('../../helpers/sorting')),
	getFilterQuery: vi.fn().mockReturnValue('inId:"2"')
}));

describe('useConversationListByFolder on mailbox refresh', () => {
	it('should search the conversations again when the mailbox is refreshed', async () => {
		const firstSearchInterceptor = createSoapAPIInterceptor<SearchRequest>('Search');
		renderHook(() => useConversationListByFolder('2'));
		await act(async () => {
			await firstSearchInterceptor;
		});

		const refreshSearchInterceptor = createSoapAPIInterceptor<SearchRequest>('Search');
		act(() => {
			window.dispatchEvent(new MailboxRefreshedEvent());
		});

		await act(async () => {
			expect(await refreshSearchInterceptor).toEqual(
				expect.objectContaining({ offset: 0, query: 'inId:"2"', types: 'conversation' })
			);
		});
	});

	it('should not search the conversations on mailbox refresh after unmount', async () => {
		const firstSearchInterceptor = createSoapAPIInterceptor<SearchRequest>('Search');
		const { unmount } = renderHook(() => useConversationListByFolder('2'));
		await act(async () => {
			await firstSearchInterceptor;
		});
		unmount();

		const searchRequested = vi.fn();
		createSoapAPIInterceptor<SearchRequest>('Search').then(searchRequested);
		act(() => {
			window.dispatchEvent(new MailboxRefreshedEvent());
		});

		await act(async () => {
			await new Promise((resolve) => {
				setTimeout(resolve, 50);
			});
		});
		expect(searchRequested).not.toHaveBeenCalled();
	});
});
