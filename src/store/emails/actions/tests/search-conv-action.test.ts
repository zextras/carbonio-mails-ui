import type { Mock } from 'vitest';

/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { searchConvSoapApi } from 'api/search-conv-soap-api';
import { searchConvResponse } from 'api/tests/fixtures/search-conv-response';
import { API_REQUEST_STATUS } from 'constants/index';
import { normalizeCompleteMailMessageFromSoap } from 'normalizations/normalize-message';
import {
	refreshConvEmailStoreAction,
	searchConvEmailStoreAction
} from 'store/emails/actions/search-conv-action';
import { recordNotifiedItems } from 'store/emails/notified-items';
import {
	updateMessages,
	getConversationById,
	getMessageById,
	updateConversations,
	updateConversationStatus
} from 'store/emails/store';

vi.mock('../../../../api/search-conv-soap-api');
vi.mock('../../../../normalizations/normalize-message', async (importOriginal) => ({
	...(await importOriginal<object>()),
	normalizeCompleteMailMessageFromSoap: vi.fn()
}));
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

	it('keeps the header data of a stored message that comes back without headers', async () => {
		// SearchConv sends no headers for the messages outside its query (e.g. replies in Sent)
		(searchConvSoapApi as Mock).mockResolvedValueOnce({
			m: [{ id: '2', l: '5', d: 1627849923000 }]
		});
		// what the real normalizer gives without _attrs
		(normalizeCompleteMailMessageFromSoap as Mock).mockReturnValueOnce({
			id: '2',
			sensitivity: undefined,
			messageIsFromExternalDomain: false
		});
		(getMessageById as Mock).mockReturnValueOnce({
			id: '2',
			sensitivity: 'Private',
			messageIsFromExternalDomain: true
		});
		(getConversationById as Mock).mockReturnValueOnce({ id: mockConversationId });

		await searchConvEmailStoreAction({ conversationId: mockConversationId, html: true });

		expect(updateMessages).toHaveBeenCalledWith([
			expect.objectContaining({
				id: '2',
				sensitivity: 'Private',
				messageIsFromExternalDomain: true
			})
		]);
	});

	it('uses the fresh header data of a message that comes back with headers', async () => {
		(searchConvSoapApi as Mock).mockResolvedValueOnce({
			m: [{ id: '3', l: '2', d: 1627849923000, _attrs: { Sensitivity: 'Personal' } }]
		});
		(normalizeCompleteMailMessageFromSoap as Mock).mockReturnValueOnce({
			id: '3',
			sensitivity: 'Personal'
		});
		(getConversationById as Mock).mockReturnValueOnce({ id: mockConversationId });

		await searchConvEmailStoreAction({ conversationId: mockConversationId, html: true });

		expect(getMessageById).not.toHaveBeenCalled();
		expect(updateMessages).toHaveBeenCalledWith([
			expect.objectContaining({ id: '3', sensitivity: 'Personal' })
		]);
	});

	it('looks up the stored headers only for the messages the server sends without them', async () => {
		// a real SearchConv: the reply in Sent (263) is outside the query and has no _attrs
		(searchConvSoapApi as Mock).mockResolvedValueOnce(searchConvResponse);
		(normalizeCompleteMailMessageFromSoap as Mock).mockImplementation((msg: { id: string }) => ({
			id: msg.id
		}));
		(getConversationById as Mock).mockReturnValueOnce({ id: '259' });

		await searchConvEmailStoreAction({ conversationId: '259', html: true });

		expect(getMessageById).toHaveBeenCalledTimes(1);
		expect(getMessageById).toHaveBeenCalledWith('263');
		expect(updateConversations).toHaveBeenCalledWith([
			expect.objectContaining({ id: '259', messageIds: ['263', '260'] })
		]);
	});
});

describe('refreshConvEmailStoreAction', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		(normalizeCompleteMailMessageFromSoap as Mock).mockImplementation((msg: { id: string }) => ({
			id: msg.id
		}));
	});

	it('updates the conversation in place without changing its status', async () => {
		(searchConvSoapApi as Mock).mockResolvedValueOnce({ m: [{ id: '1', _attrs: {} }] });
		(getConversationById as Mock).mockReturnValueOnce({ id: 'conv' });

		await refreshConvEmailStoreAction({ conversationId: 'conv', html: true });

		expect(updateConversationStatus).not.toHaveBeenCalled();
		expect(updateMessages).toHaveBeenCalledWith([{ id: '1' }]);
		expect(updateConversations).toHaveBeenCalledWith([{ id: 'conv', messageIds: ['1'] }]);
	});

	it('does not bring back the messages deleted while the search is in progress', async () => {
		(searchConvSoapApi as Mock).mockImplementationOnce(async () => {
			recordNotifiedItems({ deletedIds: ['1'], changedIds: [] });
			return {
				m: [
					{ id: '1', _attrs: {} },
					{ id: '2', _attrs: {} }
				]
			};
		});
		(getConversationById as Mock).mockReturnValueOnce({ id: 'conv' });

		await refreshConvEmailStoreAction({ conversationId: 'conv', html: true });

		expect(updateMessages).toHaveBeenCalledWith([{ id: '2' }]);
		expect(updateConversations).toHaveBeenCalledWith([{ id: 'conv', messageIds: ['2'] }]);
	});

	it('keeps what was notified for the stored messages changed while the search is in progress', async () => {
		(searchConvSoapApi as Mock).mockImplementationOnce(async () => {
			recordNotifiedItems({ deletedIds: [], changedIds: ['1', '3'] });
			return {
				m: [
					{ id: '1', _attrs: {} },
					{ id: '2', _attrs: {} },
					{ id: '3', _attrs: {} }
				]
			};
		});
		// 1 is stored, 3 is not stored yet
		(getMessageById as Mock).mockImplementation((id: string) => (id === '1' ? { id } : undefined));
		(getConversationById as Mock).mockReturnValueOnce({ id: 'conv' });

		await refreshConvEmailStoreAction({ conversationId: 'conv', html: true });

		expect(updateMessages).toHaveBeenCalledWith([{ id: '2' }, { id: '3' }]);
		expect(updateConversations).toHaveBeenCalledWith([{ id: 'conv', messageIds: ['1', '2', '3'] }]);
	});

	it('keeps what was notified for the conversation changed while the search is in progress', async () => {
		(searchConvSoapApi as Mock).mockImplementationOnce(async () => {
			recordNotifiedItems({ deletedIds: [], changedIds: ['conv'] });
			return { m: [{ id: '1', _attrs: {} }] };
		});
		(getConversationById as Mock).mockReturnValueOnce({ id: 'conv', messageIds: ['1', '4'] });

		await refreshConvEmailStoreAction({ conversationId: 'conv', html: true });

		expect(updateConversations).not.toHaveBeenCalled();
	});

	it('leaves the conversation deleted while the search is in progress', async () => {
		(searchConvSoapApi as Mock).mockImplementationOnce(async () => {
			recordNotifiedItems({ deletedIds: ['conv'], changedIds: [] });
			return { m: [{ id: '1', _attrs: {} }] };
		});

		await refreshConvEmailStoreAction({ conversationId: 'conv', html: true });

		expect(updateMessages).not.toHaveBeenCalled();
		expect(updateConversations).not.toHaveBeenCalled();
	});

	it('stops recording the notifications once the search is over', async () => {
		(searchConvSoapApi as Mock).mockResolvedValueOnce({ Fault: {} });
		await refreshConvEmailStoreAction({ conversationId: 'conv', html: true });
		(searchConvSoapApi as Mock).mockImplementationOnce(async () => ({
			m: [{ id: '1', _attrs: {} }]
		}));
		recordNotifiedItems({ deletedIds: ['1'], changedIds: [] });
		(getConversationById as Mock).mockReturnValueOnce({ id: 'conv' });

		await refreshConvEmailStoreAction({ conversationId: 'conv', html: true });

		expect(updateMessages).toHaveBeenCalledWith([{ id: '1' }]);
	});
});
