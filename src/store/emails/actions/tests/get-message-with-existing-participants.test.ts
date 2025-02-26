/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { getMsgSoapApi } from '../../../../api/get-msg-soap-api';
import { ParticipantRole } from '../../../../carbonio-ui-commons/constants/participants';
import { API_REQUEST_STATUS } from '../../../../constants';
import { normalizeMailMessageFromSoap } from '../../../../normalizations/normalize-message';
import { GetMsgResponse } from '../../../../types';
import { createOrUpdateMessages, updateMessageStatus } from '../../store';
import { getMessageWithExistingParticipantsEmailStoreAction } from '../get-message-with-existing-participants';
import { getSoapMailMessage } from './test-utils';

jest.mock('../../../../api/get-msg-soap-api');
jest.mock('../../store');
jest.mock('../../../../normalizations/normalize-message');

describe('getMessageWithExistingParticipantsEmailStoreAction', () => {
	const messageId = '123';
	const message1Subject = 'message 1 Subject';
	const mockResponse: GetMsgResponse = {
		m: [getSoapMailMessage('1', { su: message1Subject })]
	};
	const addressFrom = 'user@example.com';
	const addressTo = 'other@example.com';
	it('handles successful message retrieval with participants', async () => {
		const mockParticipants = [
			{ address: addressFrom, type: ParticipantRole.FROM },
			{ address: addressTo, type: ParticipantRole.TO }
		];
		(getMsgSoapApi as jest.Mock).mockResolvedValueOnce(mockResponse);
		(normalizeMailMessageFromSoap as jest.Mock).mockReturnValueOnce({
			id: '1',
			subject: message1Subject,
			participants: mockParticipants
		});

		const result = await getMessageWithExistingParticipantsEmailStoreAction(
			messageId,
			mockParticipants
		);

		expect(updateMessageStatus).toHaveBeenCalledWith(messageId, API_REQUEST_STATUS.pending);
		expect(getMsgSoapApi).toHaveBeenCalledWith({ msgId: messageId, max: 250_000 });
		expect(createOrUpdateMessages).toHaveBeenCalledWith(expect.any(Array));
		expect(updateMessageStatus).toHaveBeenCalledWith(messageId, API_REQUEST_STATUS.fulfilled);
		expect(result).toEqual({
			id: '1',
			subject: message1Subject,
			participants: mockParticipants
		});
	});

	it('handles error during message retrieval with participants', async () => {
		const mockParticipants = [
			{ address: addressFrom, type: ParticipantRole.FROM },
			{ address: addressTo, type: ParticipantRole.TO }
		];
		(getMsgSoapApi as jest.Mock).mockRejectedValueOnce(new Error('Error'));

		const result = await getMessageWithExistingParticipantsEmailStoreAction(
			messageId,
			mockParticipants
		);

		expect(updateMessageStatus).toHaveBeenCalledWith(messageId, API_REQUEST_STATUS.pending);
		expect(updateMessageStatus).toHaveBeenCalledWith(messageId, API_REQUEST_STATUS.error);
		expect(result).toBeUndefined();
	});

	it('handles response with fault for message with participants', async () => {
		const mockParticipants = [
			{ address: addressFrom, type: ParticipantRole.FROM },
			{ address: addressTo, type: ParticipantRole.TO }
		];
		const faultResponse = { Fault: {} };
		(getMsgSoapApi as jest.Mock).mockResolvedValueOnce(faultResponse);

		const result = await getMessageWithExistingParticipantsEmailStoreAction(
			messageId,
			mockParticipants
		);

		expect(updateMessageStatus).toHaveBeenCalledWith(messageId, API_REQUEST_STATUS.pending);
		expect(updateMessageStatus).toHaveBeenCalledWith(messageId, API_REQUEST_STATUS.error);
		expect(result).toBeUndefined();
	});

	it('handles empty response for message with participants', async () => {
		const mockParticipants = [
			{ address: addressFrom, type: ParticipantRole.FROM },
			{ address: addressTo, type: ParticipantRole.TO }
		];
		const emptyResponse = { m: [] };
		(getMsgSoapApi as jest.Mock).mockResolvedValueOnce(emptyResponse);

		const result = await getMessageWithExistingParticipantsEmailStoreAction(
			messageId,
			mockParticipants
		);

		expect(updateMessageStatus).toHaveBeenCalledWith(messageId, API_REQUEST_STATUS.pending);
		expect(createOrUpdateMessages).toHaveBeenCalledWith([]);
		expect(updateMessageStatus).toHaveBeenCalledWith(messageId, API_REQUEST_STATUS.fulfilled);
		expect(result).toBeUndefined();
	});
});
