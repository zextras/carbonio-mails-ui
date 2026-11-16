/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { HttpResponse } from 'msw';

import {
	createAPIInterceptor,
	createSoapAPIInterceptor
} from '@test-utils/network/msw/create-api-interceptor';
import { buildSoapErrorResponseBody } from '@test-utils/utils/soap';
import { convActionSoapApi } from 'api/conv-action-soap-api';

describe('convActionSoapApi', () => {
	it('should send the action with the given ids and operation', async () => {
		const interceptor = createSoapAPIInterceptor('ConvAction', {
			action: { id: '1,2', op: 'flag' }
		});
		convActionSoapApi({ ids: ['1', '2'], operation: 'flag' });
		const request = await interceptor;

		expect(request).toEqual({ _jsns: 'urn:zimbraMail', action: { id: '1,2', op: 'flag' } });
	});

	it('should send the target constraint when given', async () => {
		const interceptor = createSoapAPIInterceptor('ConvAction', {
			action: { id: '1', op: 'move' }
		});
		convActionSoapApi({ ids: ['1'], operation: 'move', parent: '257', tcon: 'o' });
		const request = await interceptor;

		expect(request).toEqual({
			_jsns: 'urn:zimbraMail',
			action: { id: '1', op: 'move', l: '257', tcon: 'o' }
		});
	});

	it('should resolve with the Fault when the server returns one', async () => {
		const fault = buildSoapErrorResponseBody({
			detailCode: 'mail.NO_SUCH_CONV',
			reason: 'no such item: 1'
		});
		createAPIInterceptor(
			'post',
			'/service/soap/ConvActionRequest',
			HttpResponse.json({ Body: fault })
		);

		const result = await convActionSoapApi({ ids: ['1'], operation: 'flag' });

		expect(result).toEqual(fault);
	});
});
