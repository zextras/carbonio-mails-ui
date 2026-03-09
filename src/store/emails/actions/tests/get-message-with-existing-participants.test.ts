/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ParticipantRole } from '@zextras/carbonio-ui-commons';

import { generateCompleteMessageFromAPI } from '../../../../__test__/generators/api';
import { createSoapAPIInterceptor } from '@test-utils/network/msw/create-api-interceptor';
import { getMessageWithExistingParticipantsEmailStoreAction } from 'store/emails/actions/get-message-with-existing-participants';
import { MailMessage } from 'types/messages';
import { GetMsgRequest, GetMsgResponse } from 'types/soap/get-msg';

const stubGetMsgApi = (response: any): Promise<GetMsgRequest> =>
	createSoapAPIInterceptor<GetMsgRequest, GetMsgResponse>('GetMsg', response);

describe('getMessageWithExistingParticipantsEmailStoreAction', () => {
	const messageId = '123';
	const message1Subject = 'message 1 Subject';
	const message = generateCompleteMessageFromAPI({ id: messageId, su: message1Subject });
	const addressFrom = 'user@example.com';
	const addressTo = 'other@example.com';
	message.e = [
		{ t: 'f', a: addressFrom, p: addressFrom },
		{ t: 't', a: addressTo, p: addressTo }
	];
	const mockResponse: GetMsgResponse = {
		m: [message]
	};
	it('handles successful message retrieval with participants', async () => {
		const mockParticipants = [
			{ address: addressFrom, type: ParticipantRole.FROM },
			{ address: addressTo, type: ParticipantRole.TO }
		];

		const getMsgApi = stubGetMsgApi(mockResponse);

		const result = (await getMessageWithExistingParticipantsEmailStoreAction(
			messageId,
			mockParticipants
		)) as MailMessage;

		const request = await getMsgApi;
		expect(request.m).toEqual(expect.objectContaining({ id: messageId, max: 250_000 }));
		expect(result.id).toEqual(messageId);
		expect(result.subject).toEqual(message1Subject);
		expect(result.participants?.[0]).toEqual(expect.objectContaining(mockParticipants[0]));
		expect(result.participants?.[1]).toEqual(expect.objectContaining(mockParticipants[1]));
	});

	it('handles error during message retrieval with participants', async () => {
		const mockParticipants = [
			{ address: addressFrom, type: ParticipantRole.FROM },
			{ address: addressTo, type: ParticipantRole.TO }
		];

		const getMsgApi = stubGetMsgApi({ Fault: {} });

		const result = await getMessageWithExistingParticipantsEmailStoreAction(
			messageId,
			mockParticipants
		);

		await getMsgApi;

		expect(result).toBeUndefined();
	});

	it('handles response with fault for message with participants', async () => {
		const mockParticipants = [
			{ address: addressFrom, type: ParticipantRole.FROM },
			{ address: addressTo, type: ParticipantRole.TO }
		];
		const faultResponse = { Fault: {} };
		const getMsgApi = stubGetMsgApi(faultResponse);
		const result = await getMessageWithExistingParticipantsEmailStoreAction(
			messageId,
			mockParticipants
		);
		await getMsgApi;
		expect(result).toBeUndefined();
	});

	it.skip('handles empty response for message with participants', async () => {
		// FIXME: code is not able to handle empty responses
		const mockParticipants = [
			{ address: addressFrom, type: ParticipantRole.FROM },
			{ address: addressTo, type: ParticipantRole.TO }
		];
		const emptyResponse = { m: [] };
		const getMsgApi = stubGetMsgApi(emptyResponse);
		const result = await getMessageWithExistingParticipantsEmailStoreAction(
			messageId,
			mockParticipants
		);
		await getMsgApi;
		expect(result).toBeUndefined();
	});
});
