/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { getMsgSoapApi } from '../../../../api/get-msg-soap-api';
import { getMsgDecryptSoapApi } from '../../../../api/get-msg-soap-api-decrypt';
import { API_REQUEST_STATUS } from '../../../../constants';
import { normalizeMailMessageFromSoap } from '../../../../normalizations/normalize-message';
import { GetMsgResponse } from '../../../../types';
import { updateMessages, updateMessageStatus } from '../../store';
import {
	getMessageEmailStoreAction,
	getFullMessageEmailStoreAction,
	getMessageDecryptEmailStoreAction
} from '../get-message';
import { getSoapMailMessage } from './test-utils';

jest.mock('../../../../api/get-msg-soap-api');
jest.mock('../../../../api/get-msg-soap-api-decrypt');
jest.mock('../../store');
jest.mock('../../../../normalizations/normalize-message');

describe('get-message', () => {
	describe('getMessageEmailStoreAction', () => {
		const mockMessageId = '123';
		const mockResponse: GetMsgResponse = {
			// eslint-disable-next-line sonarjs/no-duplicate-string
			m: [getSoapMailMessage('1', { su: 'message 1 Subject' })]
		};

		const mockResponseEncryptMessage: GetMsgResponse = {
			// eslint-disable-next-line sonarjs/no-duplicate-string
			m: [
				getSoapMailMessage('1', {
					su: 'message 1 Subject',
					mp: [
						{
							part: 'att1,att2',
							ct: 'multipart/alternative',
							filename: 'smime.p7m',
							requiresSmartLinkConversion: false
						}
					]
				})
			]
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

		it('handles successful decrypt message retrieval', async () => {
			(getMsgDecryptSoapApi as jest.Mock).mockResolvedValueOnce(mockResponse);
			(normalizeMailMessageFromSoap as jest.Mock).mockReturnValueOnce({
				id: '1',
				subject: 'message 1 Subject'
			});

			const result = await getMessageDecryptEmailStoreAction(mockMessageId, 'smimePassword');

			expect(updateMessageStatus).toHaveBeenCalledWith(mockMessageId, API_REQUEST_STATUS.pending);
			expect(getMsgDecryptSoapApi).toHaveBeenCalledWith({
				msgId: mockMessageId,
				max: 250_000,
				smimePassword: 'smimePassword'
			});
			expect(updateMessages).toHaveBeenCalledWith(expect.any(Array));
			expect(updateMessageStatus).toHaveBeenCalledWith(mockMessageId, API_REQUEST_STATUS.fulfilled);
			expect(result).toEqual({ id: '1', subject: 'message 1 Subject' });
		});

		it('handles decrypt message empty response', async () => {
			const emptyResponse = { m: [] };
			(getMsgDecryptSoapApi as jest.Mock).mockResolvedValueOnce(emptyResponse);

			const result = await getMessageDecryptEmailStoreAction(mockMessageId, 'smimePassword');

			expect(updateMessageStatus).toHaveBeenCalledWith(mockMessageId, API_REQUEST_STATUS.pending);
			expect(updateMessages).toHaveBeenCalledWith([]);
			expect(updateMessageStatus).toHaveBeenCalledWith(mockMessageId, API_REQUEST_STATUS.fulfilled);
			expect(result).toBeUndefined();
		});

		it('handles enable to decrypt message response', async () => {
			(getMsgDecryptSoapApi as jest.Mock).mockResolvedValueOnce(mockResponseEncryptMessage);

			const result = await getMessageDecryptEmailStoreAction(mockMessageId, 'smimePassword');

			expect(updateMessageStatus).toHaveBeenCalledWith(mockMessageId, API_REQUEST_STATUS.pending);
			expect(getMsgDecryptSoapApi).toHaveBeenCalledWith({
				msgId: mockMessageId,
				max: 250_000,
				smimePassword: 'smimePassword'
			});
			expect(result).toEqual(undefined);
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
