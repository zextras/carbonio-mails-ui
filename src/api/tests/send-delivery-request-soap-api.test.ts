/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { HttpResponse } from 'msw';

import {
	createAPIInterceptor,
	createSoapAPIInterceptor
} from '@test-utils/network/msw/create-api-interceptor';
import { buildSoapErrorResponseBody } from '@test-utils/utils/soap';
import { sendDeliveryReportSoapApi } from 'api/send-delivery-request-soap-api';

describe('sendDeliveryReportSoapApi', () => {
	it('should call soapFetch with the correct parameters', async () => {
		const interceptor = createSoapAPIInterceptor('SendDeliveryReport', { success: true });
		sendDeliveryReportSoapApi('1');
		const request = await interceptor;
		expect(request).toEqual({
			_jsns: 'urn:zimbraMail',
			mid: '1'
		});
	});

	it('should return the expected result when soapFetch resolves', async () => {
		createSoapAPIInterceptor('SendDeliveryReport', { success: true });
		const result = await sendDeliveryReportSoapApi('1');
		expect(result).toEqual({ success: true });
	});

	it('should resolve with the Fault when the server returns one', async () => {
		const fault = buildSoapErrorResponseBody({
			detailCode: 'mail.NO_SUCH_MSG',
			reason: 'no such item: 123'
		});
		createAPIInterceptor(
			'post',
			'/service/soap/SendDeliveryReportRequest',
			HttpResponse.json({ Body: fault })
		);

		const result = await sendDeliveryReportSoapApi('123');

		expect(result).toEqual(fault);
	});
});
