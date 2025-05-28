/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { sendDeliveryReportSoapApi } from '../send-delivery-request-soap-api';
import { createSoapAPIInterceptor } from '@test-utils/network/msw/create-api-interceptor';

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
});
