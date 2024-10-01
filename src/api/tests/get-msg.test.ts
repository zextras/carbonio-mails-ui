/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createSoapAPIInterceptor } from '../../carbonio-ui-commons/test/mocks/network/msw/create-api-interceptor';
import { GetMsgRequest } from '../../types';
import { getMsgSoapAPI } from '../get-msg';

describe('GetMsg', () => {
	it('should send max parameter if present', async () => {
		const interceptor = createSoapAPIInterceptor<GetMsgRequest>('GetMsg');
		getMsgSoapAPI({ msgId: '1', max: 10 });
		const request = await interceptor;
		expect(request.m.max).toBe(10);
	});
	it('should not send max parameter if not present', async () => {
		const interceptor = createSoapAPIInterceptor<GetMsgRequest>('GetMsg');
		getMsgSoapAPI({ msgId: '1' });
		const request = await interceptor;
		expect(request.m.max).not.toBeDefined();
	});
});
