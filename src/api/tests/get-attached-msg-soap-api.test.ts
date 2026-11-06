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
import { getAttachedMsgSoapApi } from 'api/get-attached-msg-soap-api';
import { getMsgAttachedEmlResponse } from 'api/tests/fixtures/get-msg-attached-eml-response';
import { GetAttachedMsgResponse, GetMsgRequest } from 'types/soap/get-msg';

describe('getAttachedMsgSoapApi', () => {
	it('asks for the part of the message that holds the attached one', async () => {
		const interceptor = createSoapAPIInterceptor<GetMsgRequest>('GetMsg');

		const response = getAttachedMsgSoapApi({ msgId: '262', part: '2', html: true });

		const request = await interceptor;
		expect(request.m).toEqual(
			expect.objectContaining({ id: '262', part: '2', html: true, needExp: 1 })
		);
		expect(request.m.header).toContainEqual({ n: 'Sensitivity' });
		await response;
	});

	it('returns the attached message', async () => {
		createSoapAPIInterceptor<GetMsgRequest, GetAttachedMsgResponse>(
			'GetMsg',
			getMsgAttachedEmlResponse
		);

		const response = await getAttachedMsgSoapApi({ msgId: '262', part: '2', html: true });

		expect(response).toEqual(getMsgAttachedEmlResponse);
	});

	it('returns the fault when the server rejects the request', async () => {
		const fault = buildSoapErrorResponseBody({ detailCode: 'mail.NO_SUCH_PART' });
		createAPIInterceptor('post', '/service/soap/GetMsgRequest', HttpResponse.json({ Body: fault }));

		const response = await getAttachedMsgSoapApi({ msgId: '262', part: '9', html: true });

		expect(response).toEqual(fault);
	});
});
