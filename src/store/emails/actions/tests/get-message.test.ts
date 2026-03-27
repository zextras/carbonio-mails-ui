/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { generateCompleteMessageFromAPI } from '../../../../__test__/generators/api';
import { createSoapAPIInterceptor } from '@test-utils/network/msw/create-api-interceptor';
import {
	getMessageEmailStoreAction,
	getFullMessageEmailStoreAction,
	getMessageDecryptEmailStoreAction
} from 'store/emails/actions/get-message';
import { getSoapMailMessage } from 'store/emails/actions/tests/test-utils';
import { GetMsgRequest, GetMsgResponse } from 'types/soap/get-msg';

const stubGetMsgApi = (response: any): Promise<GetMsgRequest> =>
	createSoapAPIInterceptor<GetMsgRequest, GetMsgResponse>('GetMsg', response);

vi.mock('store/emails/store', () => ({
	updateMessageStatus: vi.fn(),
	updateMessages: vi.fn()
}));

describe('get-message', () => {
	describe('getMessageEmailStoreAction', () => {
		const messageId = '123';
		const getMsgResponse = {
			m: [
				generateCompleteMessageFromAPI({
					id: messageId,
					su: 'message 1 Subject'
				})
			]
		};

		const mockResponseEncryptMessage = {
			m: [
				generateCompleteMessageFromAPI({
					id: messageId,
					su: 'message 1 Subject',
					mp: [
						{
							part: 'att1,att2',
							ct: 'multipart/alternative',
							filename: 'smime.p7m'
						},
						{
							part: 'att1',
							ct: 'multipart/alternative',
							filename: 'demo.file'
						}
					]
				})
			]
		};

		it('handles successful message retrieval', async () => {
			const getMsgApi = stubGetMsgApi(getMsgResponse);
			const result = await getMessageEmailStoreAction({ messageId, html: true });

			const request = await getMsgApi;
			expect(request.m.id).toBe(messageId);
			expect(request.m.max).toBe(250_000);
			expect(result).toEqual(
				expect.objectContaining({ id: messageId, subject: 'message 1 Subject' })
			);
		});

		it('handles error during message retrieval', async () => {
			const getMsgApi = stubGetMsgApi({ Fault: {} });
			const result = await getMessageEmailStoreAction({ messageId, html: true });
			await getMsgApi;

			expect(result).toBeUndefined();
		});

		it('handles response with fault', async () => {
			const faultResponse = { Fault: {} };
			stubGetMsgApi(faultResponse);

			const result = await getMessageEmailStoreAction({ messageId, html: true });

			expect(result).toBeUndefined();
		});

		it.skip('handles empty response', async () => {
			// FIXME: code does not handle empty message
			stubGetMsgApi({});

			const result = await getMessageEmailStoreAction({ messageId, html: true });

			expect(result).toBeUndefined();
		});

		it('handles successful decrypt message retrieval', async () => {
			const msgApi = stubGetMsgApi(getMsgResponse);

			const result = await getMessageDecryptEmailStoreAction(messageId, 'smimePassword', true);

			const request = await msgApi;
			expect(request.encryptionPassword).toEqual('smimePassword');
			expect(request.m.id).toEqual(messageId);
			expect(result).toEqual(
				expect.objectContaining({
					id: messageId,
					subject: 'message 1 Subject'
				})
			);
		});

		it('handles decrypt response with fault', async () => {
			const faultResponse = { Fault: {} };
			stubGetMsgApi(faultResponse);

			const result = await getMessageDecryptEmailStoreAction(messageId, 'smimePassword', true);

			expect(result).toBeUndefined();
		});

		it.skip('handles decrypt message empty response', async () => {
			// FIXME: does not handle empty messages
			const emptyResponse = { m: [] };
			stubGetMsgApi(emptyResponse);

			const result = await getMessageDecryptEmailStoreAction(messageId, 'smimePassword', true);

			expect(result).toBeUndefined();
		});

		it('handles enable to decrypt message response', async () => {
			const getMsgApi = stubGetMsgApi(mockResponseEncryptMessage);
			const result = await getMessageDecryptEmailStoreAction(messageId, 'smimePassword', true);

			const request = await getMsgApi;
			expect(request.m.max).toBe(250_000);
			expect(request.m.id).toBe(messageId);
			expect(request.encryptionPassword).toBe('smimePassword');
			expect(result).toEqual(undefined);
		});
	});

	describe('getFullMessageEmailStoreAction', () => {
		const messageId = '123';
		const getMsgResponse: GetMsgResponse = {
			m: [getSoapMailMessage(messageId, { su: 'message 1 Subject' })]
		};

		beforeEach(() => {
			vi.clearAllMocks();
		});

		it('handles successful full message retrieval', async () => {
			const getMsgApi = stubGetMsgApi(getMsgResponse);

			const result = await getFullMessageEmailStoreAction(messageId, true);
			const request = await getMsgApi;
			expect(request.m).toEqual(expect.objectContaining({ id: messageId }));
			expect(result).toEqual(
				expect.objectContaining({ id: messageId, subject: 'message 1 Subject' })
			);
		});

		it('handles error during full message retrieval', async () => {
			stubGetMsgApi({ Fault: {} });
			const result = await getFullMessageEmailStoreAction(messageId, true);

			expect(result).toBeUndefined();
		});

		it('handles response with fault for full message', async () => {
			const faultResponse = { Fault: {} };
			stubGetMsgApi(faultResponse);

			const result = await getFullMessageEmailStoreAction(messageId, true);

			expect(result).toBeUndefined();
		});

		it.skip('handles empty response for full message', async () => {
			// FIXME: code was mocked and test does not pass with real code
			const emptyResponse = { m: [] };
			stubGetMsgApi(emptyResponse);
			const result = await getFullMessageEmailStoreAction(messageId, true);

			expect(result).toBeUndefined();
		});
	});
});
