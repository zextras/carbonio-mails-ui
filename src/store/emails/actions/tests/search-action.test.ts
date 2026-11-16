import type { Mock } from 'vitest';
/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { searchSoapApi } from 'api/search-soap-api';
import { API_REQUEST_STATUS } from 'constants/index';
import {
	refreshSearchEmailStoreAction,
	searchEmailStoreAction
} from 'store/emails/actions/search-action';
import {
	updateMessagesResultsLoadingStatus,
	setMessagesInEmailStore,
	setConversationsInEmailStore,
	resetMessagesAndPopulatedItems,
	updateConversationsResultsLoadingStatus,
	refreshMessagesInEmailStore,
	refreshConversationsInEmailStore
} from 'store/emails/store';
import { SearchSoapApiParams } from 'types/conversations';
import { SORT_BY } from 'types/sorting';

vi.mock('../../../../api/search-soap-api');
vi.mock('../../store');

describe('searchEmailStoreAction', () => {
	const mockSearchResponseTypeMessage = {
		m: [{ id: '1', subject: 'Test Message' }],
		more: false
	};

	const mockSearchResponseTypeConversations = {
		c: [{ id: '1', subject: 'Test Conversation' }],
		more: false
	};

	const searchParams: SearchSoapApiParams = {
		limit: 50,
		types: 'message',
		sortBy: SORT_BY.dateDesc,
		query: 'test',
		offset: 0,
		locale: 'en',
		abortSignal: new AbortController().signal
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it(
		'calls resetMessagesAndPopulatedItems to reset Messages And PopulatedItems slice' +
			' before handling searchSoapApi response',
		async () => {
			(searchSoapApi as Mock).mockResolvedValueOnce(mockSearchResponseTypeMessage);
			await searchEmailStoreAction(searchParams);
			expect(resetMessagesAndPopulatedItems).toHaveBeenCalledTimes(1);
		}
	);

	it('does not apply the results of an aborted search', async () => {
		const controller = new AbortController();
		(searchSoapApi as Mock).mockImplementationOnce(async () => {
			controller.abort();
			return mockSearchResponseTypeMessage;
		});

		await searchEmailStoreAction({ ...searchParams, abortSignal: controller.signal });

		expect(resetMessagesAndPopulatedItems).not.toHaveBeenCalled();
		expect(setMessagesInEmailStore).not.toHaveBeenCalled();
	});

	it('handles successful message search response', async () => {
		(searchSoapApi as Mock).mockResolvedValueOnce(mockSearchResponseTypeMessage);
		await searchEmailStoreAction(searchParams);
		expect(setMessagesInEmailStore).toHaveBeenCalledWith(
			expect.any(Array),
			mockSearchResponseTypeMessage.more
		);
		expect(updateMessagesResultsLoadingStatus).toHaveBeenCalledWith(API_REQUEST_STATUS.fulfilled);
	});

	it('handles successful conversation search response', async () => {
		(searchSoapApi as Mock).mockResolvedValueOnce(mockSearchResponseTypeConversations);
		await searchEmailStoreAction({ ...searchParams, types: 'conversation' });
		expect(setConversationsInEmailStore).toHaveBeenCalledWith(
			expect.any(Array),
			mockSearchResponseTypeConversations.more
		);
		expect(updateConversationsResultsLoadingStatus).toHaveBeenCalledWith(
			API_REQUEST_STATUS.fulfilled
		);
	});

	it('updates message loading status when error response and type is message', async () => {
		const errorResponse = { Fault: {} };
		(searchSoapApi as Mock).mockResolvedValueOnce(errorResponse);
		await searchEmailStoreAction({ ...searchParams, types: 'message' });
		expect(updateMessagesResultsLoadingStatus).toHaveBeenCalledWith(API_REQUEST_STATUS.error);
	});

	it('updates conversation loading status when error response and type is conversation', async () => {
		const errorResponse = { Fault: {} };
		(searchSoapApi as Mock).mockResolvedValueOnce(errorResponse);
		await searchEmailStoreAction({ ...searchParams, types: 'conversation' });
		expect(updateConversationsResultsLoadingStatus).toHaveBeenCalledWith(API_REQUEST_STATUS.error);
	});

	it('handles empty message response', async () => {
		const emptyResponse = { m: [], more: false };
		(searchSoapApi as Mock).mockResolvedValueOnce(emptyResponse);
		await searchEmailStoreAction(searchParams);
		expect(resetMessagesAndPopulatedItems).toHaveBeenCalled();
		expect(updateMessagesResultsLoadingStatus).not.toHaveBeenCalledWith(
			API_REQUEST_STATUS.fulfilled
		);
	});

	it('handles empty conversation response', async () => {
		const emptyResponse = { m: [], c: [], more: false };
		(searchSoapApi as Mock).mockResolvedValueOnce(emptyResponse);
		await searchEmailStoreAction({ ...searchParams, types: 'conversation' });
		expect(resetMessagesAndPopulatedItems).toHaveBeenCalled();
		expect(updateConversationsResultsLoadingStatus).not.toHaveBeenCalledWith(
			API_REQUEST_STATUS.fulfilled
		);
	});
});

describe('refreshSearchEmailStoreAction', () => {
	const refreshParams = {
		searchedListIndex: ['1'],
		sortBy: SORT_BY.dateDesc,
		query: 'inId:"2"',
		locale: 'en',
		abortSignal: new AbortController().signal
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('merges the messages of the list without resetting the store', async () => {
		(searchSoapApi as Mock).mockResolvedValueOnce({ m: [{ id: '1' }], more: true });

		await refreshSearchEmailStoreAction({ ...refreshParams, types: 'message' });

		expect(searchSoapApi).toHaveBeenCalledWith(expect.objectContaining({ offset: 0 }));
		expect(refreshMessagesInEmailStore).toHaveBeenCalledWith(
			[expect.objectContaining({ id: '1' })],
			true,
			['1']
		);
		expect(resetMessagesAndPopulatedItems).not.toHaveBeenCalled();
		expect(setMessagesInEmailStore).not.toHaveBeenCalled();
	});

	it('searches again the pages loaded by scrolling', async () => {
		(searchSoapApi as Mock).mockResolvedValueOnce({ more: false });
		const searchedListIndex = Array.from({ length: 150 }, (_, index) => `${index}`);

		await refreshSearchEmailStoreAction({ ...refreshParams, searchedListIndex, types: 'message' });

		expect(searchSoapApi).toHaveBeenCalledWith(expect.objectContaining({ limit: 150, offset: 0 }));
	});

	it('searches at least the first page', async () => {
		(searchSoapApi as Mock).mockResolvedValueOnce({ more: false });

		await refreshSearchEmailStoreAction({ ...refreshParams, types: 'message' });

		expect(searchSoapApi).toHaveBeenCalledWith(expect.objectContaining({ limit: 100 }));
	});

	it('empties the list of messages when the folder has no more messages', async () => {
		(searchSoapApi as Mock).mockResolvedValueOnce({ more: false });

		await refreshSearchEmailStoreAction({ ...refreshParams, types: 'message' });

		expect(refreshMessagesInEmailStore).toHaveBeenCalledWith([], false, ['1']);
	});

	it('merges the conversations of the list and their messages without resetting the store', async () => {
		(searchSoapApi as Mock).mockResolvedValueOnce({
			c: [{ id: '1', m: [{ id: '10' }] }],
			more: false
		});

		await refreshSearchEmailStoreAction({ ...refreshParams, types: 'conversation' });

		expect(refreshConversationsInEmailStore).toHaveBeenCalledWith(
			[expect.objectContaining({ id: '1' })],
			[expect.objectContaining({ id: '10' })],
			false,
			['1']
		);
		expect(resetMessagesAndPopulatedItems).not.toHaveBeenCalled();
		expect(setConversationsInEmailStore).not.toHaveBeenCalled();
	});

	it('does not apply the results of an aborted refresh', async () => {
		const controller = new AbortController();
		(searchSoapApi as Mock).mockImplementationOnce(async () => {
			controller.abort();
			return { m: [{ id: '1' }], more: false };
		});

		await refreshSearchEmailStoreAction({
			...refreshParams,
			types: 'message',
			abortSignal: controller.signal
		});

		expect(refreshMessagesInEmailStore).not.toHaveBeenCalled();
	});

	it('leaves the list as it is when the search fails', async () => {
		(searchSoapApi as Mock).mockResolvedValueOnce({ Fault: {} });

		await refreshSearchEmailStoreAction({ ...refreshParams, types: 'conversation' });

		expect(refreshConversationsInEmailStore).not.toHaveBeenCalled();
		expect(updateConversationsResultsLoadingStatus).not.toHaveBeenCalled();
	});
});
