/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createSoapAPIInterceptor } from '@test-utils/network/msw/create-api-interceptor';
import { getMsgSoapApi } from 'api/get-msg-soap-api';
import { GetMsgRequest } from 'types/index.d';

describe('GetMsg', () => {
	it('should send max parameter if present', async () => {
		const interceptor = createSoapAPIInterceptor<GetMsgRequest>('GetMsg');
		getMsgSoapApi({ msgId: '1', max: 10 });
		const request = await interceptor;
		expect(request.m.max).toBe(10);
	});
	it('should not send max parameter if not present', async () => {
		const interceptor = createSoapAPIInterceptor<GetMsgRequest>('GetMsg');
		getMsgSoapApi({ msgId: '1' });
		const request = await interceptor;
		expect(request.m.max).not.toBeDefined();
	});
});
