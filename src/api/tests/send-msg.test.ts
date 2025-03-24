/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { waitFor } from '@testing-library/react';
import * as shellHooks from '@zextras/carbonio-shell-ui';
import * as shellSpy from '@zextras/carbonio-shell-ui';

import { ParticipantRole } from '../../carbonio-ui-commons/constants/participants';
import { generateAccount } from '../../carbonio-ui-commons/test/mocks/accounts/account-generator';
import { createSoapAPIInterceptor } from '../../carbonio-ui-commons/test/mocks/network/msw/create-api-interceptor';
import { generateEditor } from '../../store/editor/editor-generators';
import { getConvEmailStoreAction } from '../../store/emails/actions/get-conv-action';
import { getMessageWithExistingParticipantsEmailStoreAction } from '../../store/emails/actions/get-message-with-existing-participants';
import { generateMessage } from '../../tests/generators/generateMessage';
import { MailMessage, MailsEditorV2 } from '../../types';
import { SoapSendMsgRequest, SoapSendMsgResponse } from '../../types/soap/send-msg';
import { sendMsg, sendMsgFromEditor } from '../send-msg';

jest.mock('../../store/emails/actions/get-conv-action', () => ({
	getConvEmailStoreAction: jest.fn()
}));

jest.mock('../../store/emails/actions/get-message-with-existing-participants', () => ({
	getMessageWithExistingParticipantsEmailStoreAction: jest.fn()
}));

describe('sendMsg', () => {
	it('should send a message and trigger store actions on success', async () => {
		const msg = generateMessage({ id: '1' });

		const interceptor = createSoapAPIInterceptor('SendMsg', { m: [{ id: '1', cid: '123' }] });

		await sendMsg({ msg });
		const request = await interceptor;

		expect(request).toEqual(expect.objectContaining({ m: expect.objectContaining({ id: '1' }) }));
		await waitFor(async () => {
			expect(getConvEmailStoreAction).toHaveBeenCalledWith({ id: '123' });
		});
		expect(getMessageWithExistingParticipantsEmailStoreAction).toHaveBeenCalledWith(
			'1', // messageId
			expect.arrayContaining([expect.any(Object)]) // participants
		);
	});

	it('should skip store actions if response does not include id or cid', async () => {
		const msg = generateMessage({ id: '1' });

		const interceptor = createSoapAPIInterceptor('SendMsg', { m: [] });

		await sendMsg({ msg });
		const request = await interceptor;

		expect(request).toEqual(expect.objectContaining({ m: expect.objectContaining({ id: '1' }) }));
		await waitFor(async () => {
			expect(getConvEmailStoreAction).not.toHaveBeenCalled();
		});
		expect(getMessageWithExistingParticipantsEmailStoreAction).not.toHaveBeenCalled();
	});

	it('should return the response received from the api call', async () => {
		const msg = generateMessage({ id: '1' });
		const response = { m: [{ id: '1', cid: '123' }] };
		createSoapAPIInterceptor('SendMsg', response);

		const result = await sendMsg({ msg });

		expect(result).toEqual(response);
	});
});

describe('Reply-To Header', () => {
	const replyToAddress = 'replyTo@test.com';
	const identityId = '3b778c1d-529f-45b7-b131-5162c83551f7';
	const defaultIdentity = {
		id: identityId,
		name: 'DEFAULT',
		_attrs: {
			zimbraPrefReplyToEnabled: 'TRUE',
			zimbraPrefReplyToAddress: replyToAddress,
			zimbraPrefIdentityId: '3b778c1d-529f-45b7-b131-5162c83551f7'
		}
	} as shellHooks.Identity;
	const mainAccountAddress = 'default@test.com';
	const mainAccount: shellHooks.Account = {
		...generateAccount(),
		id: defaultIdentity.id,
		name: mainAccountAddress,
		displayName: 'default account',
		identities: { identity: [defaultIdentity] },
		rights: [] as never // cannot import AccountRights from carbonio-shell-ui
	};
	beforeEach(() => {
		jest.spyOn(shellSpy, 'getUserAccount').mockReturnValue(mainAccount);
	});
	describe('Send Msg', () => {
		it('should add reply-to to existing participants when setting is defined', async () => {
			const response = { _jsns: 'zimbraMail', m: [{ id: '1', cid: '123' }] };
			const sendMsgInterceptor = createSoapAPIInterceptor<SoapSendMsgRequest, SoapSendMsgResponse>(
				'SendMsg',
				response
			);
			const recipient1Address = 'recipient1@test.com';
			const msg: MailMessage = {
				...generateMessage({ id: '1' }),
				participants: [
					{ type: ParticipantRole.FROM, address: mainAccountAddress },
					{ type: ParticipantRole.TO, address: recipient1Address }
				]
			};

			await sendMsg({ msg });

			const sendMsgRequest = await sendMsgInterceptor;
			const participants = sendMsgRequest.m.e;
			expect(participants).toEqual([
				{
					a: mainAccountAddress,
					t: ParticipantRole.FROM
				},
				{
					a: recipient1Address,
					t: ParticipantRole.TO
				},
				{
					a: replyToAddress,
					t: ParticipantRole.REPLY_TO
				}
			]);
		});
	});
	describe('Send Msg from Editor', () => {
		it('should add reply-to participant when reply-to is set in Mails settings', async () => {
			const editor = generateEditor({ action: 'new' }) as MailsEditorV2;
			const response = { _jsns: 'zimbraMail', m: [{ id: '1', cid: '123' }] };
			const sendMsgInterceptor = createSoapAPIInterceptor<SoapSendMsgRequest, SoapSendMsgResponse>(
				'SendMsg',
				response
			);

			await sendMsgFromEditor({ editor });

			const sendMsgRequest = await sendMsgInterceptor;
			const participants = sendMsgRequest.m.e;
			expect(participants).toEqual(
				expect.arrayContaining([
					{
						a: replyToAddress,
						t: ParticipantRole.REPLY_TO
					}
				])
			);
		});
	});
});
