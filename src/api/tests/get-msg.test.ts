/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createSoapAPIInterceptor } from '@test-utils/network/msw/create-api-interceptor';
import { getMsgSoapApi } from 'api/get-msg-soap-api';
import { GetMsgRequest } from 'types/soap/get-msg';

describe('GetMsg', () => {
	it('should send max parameter if present', async () => {
		const interceptor = createSoapAPIInterceptor<GetMsgRequest>('GetMsg');
		getMsgSoapApi({ msgId: '1', max: 10, html: true });
		const request = await interceptor;
		expect(request.m.max).toBe(10);
	});
	it('should not send max parameter if not present', async () => {
		const interceptor = createSoapAPIInterceptor<GetMsgRequest>('GetMsg');
		getMsgSoapApi({ msgId: '1', html: true });
		const request = await interceptor;
		expect(request.m.max).not.toBeDefined();
	});

	describe('read parameter', () => {
		it('should include read=1 when read parameter is true', async () => {
			const interceptor = createSoapAPIInterceptor<GetMsgRequest>('GetMsg');
			getMsgSoapApi({ msgId: '1', shouldMarkAsRead: true, html: true });
			const request = await interceptor;
			expect(request.m.read).toBe(1);
		});

		it('should NOT include read parameter when read is false', async () => {
			const interceptor = createSoapAPIInterceptor<GetMsgRequest>('GetMsg');
			getMsgSoapApi({ msgId: '1', shouldMarkAsRead: false, html: true });
			const request = await interceptor;
			expect(request.m.read).toBeUndefined();
		});

		it('should NOT include read parameter when read is not provided', async () => {
			const interceptor = createSoapAPIInterceptor<GetMsgRequest>('GetMsg');
			getMsgSoapApi({ msgId: '1', html: true });
			const request = await interceptor;
			expect(request.m.read).toBeUndefined();
		});

		it('should work with both max and read parameters', async () => {
			const interceptor = createSoapAPIInterceptor<GetMsgRequest>('GetMsg');
			getMsgSoapApi({ msgId: '1', max: 250000, shouldMarkAsRead: true, html: true });
			const request = await interceptor;
			expect(request.m.max).toBe(250000);
			expect(request.m.read).toBe(1);
		});
	});
});
