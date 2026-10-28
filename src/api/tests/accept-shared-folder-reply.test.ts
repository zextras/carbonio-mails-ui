/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { ParticipantRole } from '@zextras/carbonio-ui-commons';

import { createSoapAPIInterceptor } from '@test-utils/network/msw/create-api-interceptor';
import { acceptSharedFolderReply } from 'api/accept-shared-folder-reply';
import { SaveDraftRequest } from 'types/soap/save-draft';
import { SoapSendMsgResponse } from 'types/soap/send-msg';

describe('acceptSharedFolderReply', () => {
	it('sends the reply to the participants it receives', async () => {
		const sendMsgInterceptor = createSoapAPIInterceptor<SaveDraftRequest, SoapSendMsgResponse>(
			'SendMsg',
			{ m: [{ id: '1' }], _jsns: 'urn:zimbraMail' }
		);

		await acceptSharedFolderReply({
			attach: { mp: [] },
			subject: 'Share Accepted: folder shared by owner',
			participants: [
				{ type: ParticipantRole.FROM, address: 'grantee@example.com', fullName: 'Grantee' },
				{ type: ParticipantRole.TO, address: 'owner@example.com', fullName: 'Owner' }
			],
			text: ['Accepted', '']
		});

		const request = await sendMsgInterceptor;
		expect(request.m.e).toEqual([
			{ t: 'f', a: 'grantee@example.com', p: 'Grantee' },
			{ t: 't', a: 'owner@example.com', p: 'Owner' }
		]);
		expect(request.m.su).toEqual({ _content: 'Share Accepted: folder shared by owner' });
		expect(request.m.mp).toEqual([
			{ ct: 'text/plain', body: true, content: { _content: 'Accepted' } }
		]);
	});
});
