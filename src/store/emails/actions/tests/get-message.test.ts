/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { getMsgSoapApi } from '../../../../api/get-msg-soap-api';
import { API_REQUEST_STATUS } from '../../../../constants';
import { normalizeMailMessageFromSoap } from '../../../../normalizations/normalize-message';
import { GetMsgResponse } from '../../../../types';
import { updateMessages, updateMessageStatus } from '../../store';
import { getMessageEmailStoreAction, getFullMessageEmailStoreAction } from '../get-message';
import { getSoapMailMessage } from './test-utils';

jest.mock('../../../../api/get-msg-soap-api');
jest.mock('../../store');
jest.mock('../../../../normalizations/normalize-message');

describe('get-message', () => {
	describe('getMessageEmailStoreAction', () => {
		const mockMessageId = '123';
		const mockResponse: GetMsgResponse = {
			// eslint-disable-next-line sonarjs/no-duplicate-string
			m: [getSoapMailMessage('1', { su: 'message 1 Subject' })]
		};

		beforeEach(() => {
			jest.clearAllMocks();
		});

		it('handles successful message retrieval', async () => {
			(getMsgSoapApi as jest.Mock).mockResolvedValueOnce(mockResponse);
			(normalizeMailMessageFromSoap as jest.Mock).mockReturnValueOnce({
				id: '1',
				subject: 'message 1 Subject'
			});

			const result = await getMessageEmailStoreAction(mockMessageId);

			expect(updateMessageStatus).toHaveBeenCalledWith(mockMessageId, API_REQUEST_STATUS.pending);
			expect(getMsgSoapApi).toHaveBeenCalledWith({ msgId: mockMessageId, max: 250_000 });
			expect(updateMessages).toHaveBeenCalledWith(expect.any(Array));
			expect(updateMessageStatus).toHaveBeenCalledWith(mockMessageId, API_REQUEST_STATUS.fulfilled);
			expect(result).toEqual({ id: '1', subject: 'message 1 Subject' });
		});

		it('handles error during message retrieval', async () => {
			(getMsgSoapApi as jest.Mock).mockRejectedValueOnce(new Error('Error'));

			const result = await getMessageEmailStoreAction(mockMessageId);

			expect(updateMessageStatus).toHaveBeenCalledWith(mockMessageId, API_REQUEST_STATUS.pending);
			expect(updateMessageStatus).toHaveBeenCalledWith(mockMessageId, API_REQUEST_STATUS.error);
			expect(result).toBeUndefined();
		});

		it('handles response with fault', async () => {
			const faultResponse = { Fault: {} };
			(getMsgSoapApi as jest.Mock).mockResolvedValueOnce(faultResponse);

			const result = await getMessageEmailStoreAction(mockMessageId);

			expect(updateMessageStatus).toHaveBeenCalledWith(mockMessageId, API_REQUEST_STATUS.pending);
			expect(updateMessageStatus).toHaveBeenCalledWith(mockMessageId, API_REQUEST_STATUS.error);
			expect(result).toBeUndefined();
		});

		it('handles empty response', async () => {
			const emptyResponse = { m: [] };
			(getMsgSoapApi as jest.Mock).mockResolvedValueOnce(emptyResponse);

			const result = await getMessageEmailStoreAction(mockMessageId);

			expect(updateMessageStatus).toHaveBeenCalledWith(mockMessageId, API_REQUEST_STATUS.pending);
			expect(updateMessages).toHaveBeenCalledWith([]);
			expect(updateMessageStatus).toHaveBeenCalledWith(mockMessageId, API_REQUEST_STATUS.fulfilled);
			expect(result).toBeUndefined();
		});
	});

	describe('getFullMessageEmailStoreAction', () => {
		const mockMessageId = '123';
		const mockResponse: GetMsgResponse = {
			m: [getSoapMailMessage('1', { su: 'message 1 Subject' })]
		};

		beforeEach(() => {
			jest.clearAllMocks();
		});

		it('handles successful full message retrieval', async () => {
			(getMsgSoapApi as jest.Mock).mockResolvedValueOnce(mockResponse);
			(normalizeMailMessageFromSoap as jest.Mock).mockReturnValueOnce({
				id: '1',
				subject: 'message 1 Subject'
			});

			const result = await getFullMessageEmailStoreAction(mockMessageId);

			expect(updateMessageStatus).toHaveBeenCalledWith(mockMessageId, API_REQUEST_STATUS.pending);
			expect(getMsgSoapApi).toHaveBeenCalledWith({ msgId: mockMessageId });
			expect(updateMessages).toHaveBeenCalledWith(expect.any(Array));
			expect(updateMessageStatus).toHaveBeenCalledWith(mockMessageId, API_REQUEST_STATUS.fulfilled);
			expect(result).toEqual({ id: '1', subject: 'message 1 Subject' });
		});

		it('handles error during full message retrieval', async () => {
			(getMsgSoapApi as jest.Mock).mockRejectedValueOnce(new Error('Error'));

			const result = await getFullMessageEmailStoreAction(mockMessageId);

			expect(updateMessageStatus).toHaveBeenCalledWith(mockMessageId, API_REQUEST_STATUS.pending);
			expect(updateMessageStatus).toHaveBeenCalledWith(mockMessageId, API_REQUEST_STATUS.error);
			expect(result).toBeUndefined();
		});

		it('handles response with fault for full message', async () => {
			const faultResponse = { Fault: {} };
			(getMsgSoapApi as jest.Mock).mockResolvedValueOnce(faultResponse);

			const result = await getFullMessageEmailStoreAction(mockMessageId);

			expect(updateMessageStatus).toHaveBeenCalledWith(mockMessageId, API_REQUEST_STATUS.pending);
			expect(updateMessageStatus).toHaveBeenCalledWith(mockMessageId, API_REQUEST_STATUS.error);
			expect(result).toBeUndefined();
		});

		it('handles empty response for full message', async () => {
			const emptyResponse = { m: [] };
			(getMsgSoapApi as jest.Mock).mockResolvedValueOnce(emptyResponse);

			const result = await getFullMessageEmailStoreAction(mockMessageId);

			expect(updateMessageStatus).toHaveBeenCalledWith(mockMessageId, API_REQUEST_STATUS.pending);
			expect(updateMessages).toHaveBeenCalledWith([]);
			expect(updateMessageStatus).toHaveBeenCalledWith(mockMessageId, API_REQUEST_STATUS.fulfilled);
			expect(result).toBeUndefined();
		});
	});
});
