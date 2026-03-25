/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createSoapAPIInterceptor } from '@test-utils/network/msw/create-api-interceptor';
import { generateCompleteMessageFromAPI } from '__test__/generators/api';
import { getMsgsForPrintSoapApi } from 'api/get-msg-for-print-soap-api';
import { SoapMailMessage } from 'types/soap';
import { GetMsgForPrintResponse } from 'types/soap/get-msg';

describe('getMsgsForPrintSoapApi', () => {
	it('should send a BatchRequest with one GetMsgRequest per id', async () => {
		const interceptor = createSoapAPIInterceptor('Batch');
		getMsgsForPrintSoapApi({ ids: ['1', '2'] });
		const request = await interceptor;

		expect((request as { GetMsgRequest: [] }).GetMsgRequest).toHaveLength(2);
	});

	it('should include html, needExp and read fields in each GetMsgRequest entry', async () => {
		const interceptor = createSoapAPIInterceptor('Batch');
		getMsgsForPrintSoapApi({ ids: ['42'] });
		const request = await interceptor;

		expect(
			(request as { GetMsgRequest: Array<{ m: Array<SoapMailMessage>; _jsns: string }> })
				.GetMsgRequest[0]
		).toMatchObject({
			_jsns: 'urn:zimbraMail',
			m: { id: '42', html: 1, needExp: 1, read: 1 }
		});
	});

	it('should return a normalized message for each id', async () => {
		const soapMessage = generateCompleteMessageFromAPI({ id: '7', cid: '7', l: '2' });
		const response: GetMsgForPrintResponse = {
			GetMsgResponse: [{ m: [soapMessage] }]
		};
		createSoapAPIInterceptor('Batch', response);

		const result = await getMsgsForPrintSoapApi({ ids: ['7'] });

		expect(result).toHaveLength(1);
		expect(result[0]).toMatchObject({ id: '7' });
	});

	it('should return messages with a visible body when html content is present', async () => {
		const htmlContent = '<p>Hello, print world!</p>';
		const soapMessage = generateCompleteMessageFromAPI({
			id: '10',
			mp: [{ part: '1', ct: 'text/html', s: htmlContent.length, body: true, content: htmlContent }]
		});
		const response: GetMsgForPrintResponse = {
			GetMsgResponse: [{ m: [soapMessage] }]
		};
		createSoapAPIInterceptor('Batch', response);

		const result = await getMsgsForPrintSoapApi({ ids: ['10'] });

		expect(result[0].body.content).toBe(htmlContent);
	});

	it('should return all messages when multiple ids are requested', async () => {
		const msg1 = generateCompleteMessageFromAPI({ id: '1' });
		const msg2 = generateCompleteMessageFromAPI({ id: '2' });
		const response: GetMsgForPrintResponse = {
			GetMsgResponse: [{ m: [msg1] }, { m: [msg2] }]
		};
		createSoapAPIInterceptor('Batch', response);

		const result = await getMsgsForPrintSoapApi({ ids: ['1', '2'] });

		expect(result).toHaveLength(2);
		expect(result[0]).toMatchObject({ id: '1' });
		expect(result[1]).toMatchObject({ id: '2' });
	});
});
