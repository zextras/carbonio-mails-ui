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

import { searchSoapApi } from '../../../../api/search-soap-api';
import { API_REQUEST_STATUS } from '../../../../constants';
import {
	updateMessagesResultsLoadingStatus,
	setMessagesInEmailStore,
	setConversationsInEmailStore,
	resetMessagesAndPopulatedItems,
	updateConversationsResultsLoadingStatus
} from '../../store';
import { searchEmailStoreAction } from '../search-action';

jest.mock('../../../../api/search-soap-api');
jest.mock('../../store');

describe('searchEmailStoreAction', () => {
	const mockSearchResponseTypeMessage = {
		m: [{ id: '1', subject: 'Test Message' }],
		more: false
	};

	const mockSearchResponseTypeConversations = {
		c: [{ id: '1', subject: 'Test Conversation' }],
		more: false
	};

	const searchParams = {
		folderId: 'inbox',
		limit: 50,
		before: null,
		types: 'message',
		sortBy: 'dateDesc',
		query: 'test',
		offset: 0,
		locale: 'en',
		abortSignal: new AbortController().signal
	};

	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('handles successful message search response', async () => {
		(searchSoapApi as jest.Mock).mockResolvedValueOnce(mockSearchResponseTypeMessage);
		await searchEmailStoreAction(searchParams);
		expect(setMessagesInEmailStore).toHaveBeenCalledWith(
			expect.any(Array),
			mockSearchResponseTypeMessage.more
		);
		expect(updateMessagesResultsLoadingStatus).toHaveBeenCalledWith(API_REQUEST_STATUS.fulfilled);
	});

	it('handles successful conversation search response', async () => {
		(searchSoapApi as jest.Mock).mockResolvedValueOnce(mockSearchResponseTypeConversations);
		await searchEmailStoreAction({ ...searchParams, types: 'conversation' });
		expect(setConversationsInEmailStore).toHaveBeenCalledWith(
			expect.any(Array),
			mockSearchResponseTypeConversations.more
		);
		expect(updateConversationsResultsLoadingStatus).toHaveBeenCalledWith(
			API_REQUEST_STATUS.fulfilled
		);
	});

	it('should update message loading status when error response and type is message', async () => {
		const errorResponse = { Fault: {} };
		(searchSoapApi as jest.Mock).mockResolvedValueOnce(errorResponse);
		await searchEmailStoreAction({ ...searchParams, types: 'message' });
		expect(updateMessagesResultsLoadingStatus).toHaveBeenCalledWith(API_REQUEST_STATUS.error);
	});

	it('should update conversation loading status when error response and type is conversation', async () => {
		const errorResponse = { Fault: {} };
		(searchSoapApi as jest.Mock).mockResolvedValueOnce(errorResponse);
		await searchEmailStoreAction({ ...searchParams, types: 'conversation' });
		expect(updateConversationsResultsLoadingStatus).toHaveBeenCalledWith(API_REQUEST_STATUS.error);
	});

	it('handles empty message response', async () => {
		const emptyResponse = { m: [], more: false };
		(searchSoapApi as jest.Mock).mockResolvedValueOnce(emptyResponse);
		await searchEmailStoreAction(searchParams);
		expect(resetMessagesAndPopulatedItems).toHaveBeenCalled();
		expect(updateMessagesResultsLoadingStatus).not.toHaveBeenCalledWith(
			API_REQUEST_STATUS.fulfilled
		);
	});

	it('handles empty conversation response', async () => {
		const emptyResponse = { m: [], c: [], more: false };
		(searchSoapApi as jest.Mock).mockResolvedValueOnce(emptyResponse);
		await searchEmailStoreAction({ ...searchParams, types: 'conversation' });
		expect(resetMessagesAndPopulatedItems).toHaveBeenCalled();
		expect(updateConversationsResultsLoadingStatus).not.toHaveBeenCalledWith(
			API_REQUEST_STATUS.fulfilled
		);
	});
});
