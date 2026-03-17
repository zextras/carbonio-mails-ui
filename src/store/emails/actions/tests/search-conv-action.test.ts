import type { Mock } from 'vitest';

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

vi.mock('../../../../api/search-conv-soap-api');
vi.mock('../../../../normalizations/normalize-message');
vi.mock('../../store');

describe('searchConvEmailStoreAction', () => {
	const mockConversationId = 'conv123';
	const mockResponse = {
		m: [{ id: '1', l: 'inbox', d: 1627849923000 }]
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('handles successful conversation search response', async () => {
		(searchConvSoapApi as Mock).mockResolvedValueOnce(mockResponse);
		(normalizeCompleteMailMessageFromSoap as Mock).mockReturnValueOnce({
			id: '1',
			subject: 'Test Message'
		});
		(getConversationById as Mock).mockReturnValueOnce({
			id: mockConversationId,
			messages: []
		});

		await searchConvEmailStoreAction({ conversationId: mockConversationId, html: true });

		expect(updateConversationStatus).toHaveBeenCalledWith(
			mockConversationId,
			API_REQUEST_STATUS.pending
		);
		expect(searchConvSoapApi).toHaveBeenCalledWith({
			conversationId: mockConversationId,
			fetch: 'all',
			html: true
		});
		expect(updateMessages).toHaveBeenCalledWith(expect.any(Array));
		expect(updateConversations).toHaveBeenCalledWith(expect.any(Array));
		expect(updateConversationStatus).toHaveBeenCalledWith(
			mockConversationId,
			API_REQUEST_STATUS.fulfilled
		);
	});

	it('handles error during conversation search', async () => {
		(searchConvSoapApi as Mock).mockRejectedValueOnce(new Error('Error'));

		await searchConvEmailStoreAction({ conversationId: mockConversationId, html: true });

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
		(searchConvSoapApi as Mock).mockResolvedValueOnce(faultResponse);

		await searchConvEmailStoreAction({ conversationId: mockConversationId, html: true });

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
		(searchConvSoapApi as Mock).mockResolvedValueOnce(emptyResponse);
		(getConversationById as Mock).mockReturnValueOnce({
			id: mockConversationId,
			messages: []
		});

		await searchConvEmailStoreAction({ conversationId: mockConversationId, html: true });

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
