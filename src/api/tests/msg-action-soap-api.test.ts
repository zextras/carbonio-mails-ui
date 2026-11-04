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
import { msgActionSoapApi } from 'api/msg-action-soap-api';

describe('msgActionSoapApi', () => {
	it('should send the action with the given ids and operation', async () => {
		const interceptor = createSoapAPIInterceptor('MsgAction', {
			action: { id: '1,2', op: 'flag' }
		});
		msgActionSoapApi({ ids: ['1', '2'], operation: 'flag' });
		const request = await interceptor;

		expect(request).toEqual({ _jsns: 'urn:zimbraMail', action: { id: '1,2', op: 'flag' } });
	});

	it('should resolve with the Fault when the server returns one', async () => {
		const fault = buildSoapErrorResponseBody({
			detailCode: 'mail.NO_SUCH_MSG',
			reason: 'no such item: 1'
		});
		createAPIInterceptor(
			'post',
			'/service/soap/MsgActionRequest',
			HttpResponse.json({ Body: fault })
		);

		const result = await msgActionSoapApi({ ids: ['1'], operation: 'flag' });

		expect(result).toEqual(fault);
	});
});
