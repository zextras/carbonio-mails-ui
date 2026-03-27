/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createSoapAPIInterceptor } from '@test-utils/network/msw/create-api-interceptor';
import { getMsgDecryptSoapApi } from 'api/get-msg-soap-api-decrypt';
import { GetMsgRequest } from 'types/soap/get-msg';

describe('GetMsg', () => {
	it('should send max parameter if present', async () => {
		const interceptor = createSoapAPIInterceptor<GetMsgRequest>('GetMsg');
		getMsgDecryptSoapApi({ msgId: '1', max: 10, smimePassword: 'smimePassword', html: true });
		const request = await interceptor;
		expect(request.m.max).toBe(10);
	});
	it('should not send max parameter if not present', async () => {
		const interceptor = createSoapAPIInterceptor<GetMsgRequest>('GetMsg');
		getMsgDecryptSoapApi({ msgId: '1', html: true });
		const request = await interceptor;
		expect(request.m.max).not.toBeDefined();
	});
});
