/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { ParticipantRole } from '@zextras/carbonio-ui-commons';

import { createSoapAPIInterceptor } from '@test-utils/network/msw/create-api-interceptor';
import { generateNewEditor } from '__test__/generators/editors';
import { sendMsgFromEditor } from 'api/send-msg';
import { SoapSendMsgRequest } from 'types/soap/send-msg';

const recipients = {
	to: [{ type: ParticipantRole.TO, address: 'to@demo.com', fullName: 'To Name' }],
	cc: [],
	bcc: []
};

describe('sendMsgFromEditor', () => {
	it('should send the recipient name in p', async () => {
		const interceptor = createSoapAPIInterceptor<SoapSendMsgRequest>('SendMsg');

		sendMsgFromEditor({ editor: generateNewEditor({ recipients }) });

		const request = await interceptor;
		expect(request.m.e).toContainEqual({ t: ParticipantRole.TO, a: 'to@demo.com', p: 'To Name' });
	});

	it('should not send the S/MIME options when S/MIME is off', async () => {
		const interceptor = createSoapAPIInterceptor<SoapSendMsgRequest>('SendMsg');

		sendMsgFromEditor({ editor: generateNewEditor({ recipients }) });

		const request = await interceptor;
		expect(request).not.toHaveProperty('sign');
		expect(request).not.toHaveProperty('encrypt');
		expect(request).not.toHaveProperty('encryptionType');
		expect(request).not.toHaveProperty('encryptionPassword');
	});

	it('should send sign and the S/MIME encryption type when signing', async () => {
		const interceptor = createSoapAPIInterceptor<SoapSendMsgRequest>('SendMsg');

		sendMsgFromEditor({ editor: generateNewEditor({ recipients, isSmimeSign: true }) });

		const request = await interceptor;
		expect(request.sign).toBe(true);
		expect(request).not.toHaveProperty('encrypt');
		expect(request.encryptionType).toBe('smime');
	});

	it('should send encrypt and the S/MIME encryption type when encrypting', async () => {
		const interceptor = createSoapAPIInterceptor<SoapSendMsgRequest>('SendMsg');

		sendMsgFromEditor({ editor: generateNewEditor({ recipients, isSmimeEncrypt: true }) });

		const request = await interceptor;
		expect(request.encrypt).toBe(true);
		expect(request).not.toHaveProperty('sign');
		expect(request.encryptionType).toBe('smime');
	});
});
