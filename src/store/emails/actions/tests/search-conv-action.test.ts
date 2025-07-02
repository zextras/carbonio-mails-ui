/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { searchConvSoapApi } from 'api/search-conv-soap-api';
import { API_REQUEST_STATUS } from 'constants/index';
import { normalizeCompleteMailMessageFromSoap } from 'normalizations/normalize-message';
import { searchConvEmailStoreAction } from 'store/emails/actions/search-conv-action';
import {
	updateMessages,
	getConversationById,
	updateConversations,
	updateConversationStatus
} from 'store/emails/store';

jest.mock('../../../../api/search-conv-soap-api');
jest.mock('../../../../normalizations/normalize-message');
jest.mock('../../store');

describe('searchConvEmailStoreAction', () => {
	const mockConversationId = 'conv123';
	const mockResponse = {
		m: [{ id: '1', l: 'inbox', d: 1627849923000 }]
	};

	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('handles successful conversation search response', async () => {
		(searchConvSoapApi as jest.Mock).mockResolvedValueOnce(mockResponse);
		(normalizeCompleteMailMessageFromSoap as jest.Mock).mockReturnValueOnce({
			id: '1',
			subject: 'Test Message'
		});
		(getConversationById as jest.Mock).mockReturnValueOnce({
			id: mockConversationId,
			messages: []
		});

		await searchConvEmailStoreAction(mockConversationId);

		expect(updateConversationStatus).toHaveBeenCalledWith(
			mockConversationId,
			API_REQUEST_STATUS.pending
		);
		expect(searchConvSoapApi).toHaveBeenCalledWith({
			conversationId: mockConversationId,
			fetch: 'all'
		});
		expect(updateMessages).toHaveBeenCalledWith(expect.any(Array));
		expect(updateConversations).toHaveBeenCalledWith(expect.any(Array));
		expect(updateConversationStatus).toHaveBeenCalledWith(
			mockConversationId,
			API_REQUEST_STATUS.fulfilled
		);
	});

	it('handles error during conversation search', async () => {
		(searchConvSoapApi as jest.Mock).mockRejectedValueOnce(new Error('Error'));

		await searchConvEmailStoreAction(mockConversationId);

		expect(updateConversationStatus).toHaveBeenCalledWith(
			mockConversationId,
			API_REQUEST_STATUS.pending
		);
		expect(updateConversationStatus).toHaveBeenCalledWith(
			mockConversationId,
			API_REQUEST_STATUS.error
		);
	});

	it('handles response with fault', async () => {
		const faultResponse = { Fault: {} };
		(searchConvSoapApi as jest.Mock).mockResolvedValueOnce(faultResponse);

		await searchConvEmailStoreAction(mockConversationId);

		expect(updateConversationStatus).toHaveBeenCalledWith(
			mockConversationId,
			API_REQUEST_STATUS.pending
		);
		expect(updateConversationStatus).toHaveBeenCalledWith(
			mockConversationId,
			API_REQUEST_STATUS.error
		);
	});

	it('handles empty response', async () => {
		const emptyResponse = { m: [] };
		(searchConvSoapApi as jest.Mock).mockResolvedValueOnce(emptyResponse);
		(getConversationById as jest.Mock).mockReturnValueOnce({
			id: mockConversationId,
			messages: []
		});

		await searchConvEmailStoreAction(mockConversationId);

		expect(updateConversationStatus).toHaveBeenCalledWith(
			mockConversationId,
			API_REQUEST_STATUS.pending
		);
		expect(updateMessages).toHaveBeenCalledWith([]);
		expect(updateConversations).toHaveBeenCalledWith(expect.any(Array));
		expect(updateConversationStatus).toHaveBeenCalledWith(
			mockConversationId,
			API_REQUEST_STATUS.fulfilled
		);
	});
});
