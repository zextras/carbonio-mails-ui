/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { ParticipantRole } from '@zextras/carbonio-ui-commons';

import { setupHook } from '@test-setup';
import { createSoapAPIInterceptor } from '@test-utils/network/msw/create-api-interceptor';
import { useDecline } from 'integrations/shared-invite-reply/parts/share-folder-actions';
import { SaveDraftRequest } from 'types/soap/save-draft';
import { SoapSendMsgResponse } from 'types/soap/send-msg';

describe('reply to a shared folder invitation', () => {
	it('is sent only to the organizer, from the user', async () => {
		createSoapAPIInterceptor('MsgAction', { action: { id: 'msgId', op: 'trash' } });
		const sendMsgInterceptor = createSoapAPIInterceptor<SaveDraftRequest, SoapSendMsgResponse>(
			'SendMsg',
			{ m: [{ id: '1' }], _jsns: 'urn:zimbraMail' }
		);
		const {
			result: { current: decline }
		} = setupHook(useDecline);

		await decline({
			t: vi.fn(),
			msgId: 'msgId',
			sharedFolderName: 'folderName',
			owner: 'owner',
			participants: [
				{ type: ParticipantRole.FROM, address: 'owner@example.com' },
				{ type: ParticipantRole.TO, address: 'grantee@example.com' },
				{ type: ParticipantRole.CARBON_COPY, address: 'colleague@example.com' }
			],
			grantee: 'grantee',
			customMessage: '',
			role: 'role',
			allowedActions: 'allowedActions',
			notifyOrganizer: true
		});

		const request = await sendMsgInterceptor;
		expect(request.m.e.filter((participant) => participant.t === 'f')).toHaveLength(1);
		expect(request.m.e).toEqual(
			expect.arrayContaining([expect.objectContaining({ t: 't', a: 'owner@example.com' })])
		);
		expect(request.m.e).not.toEqual(
			expect.arrayContaining([expect.objectContaining({ a: 'colleague@example.com' })])
		);
	});
});
