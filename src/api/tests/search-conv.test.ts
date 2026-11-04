/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { FOLDERS } from '@zextras/carbonio-ui-commons';
import { HttpResponse } from 'msw';

import {
	createAPIInterceptor,
	createSoapAPIInterceptor
} from '@test-utils/network/msw/create-api-interceptor';
import { buildSoapErrorResponseBody } from '@test-utils/utils/soap';
import { searchConvSoapApi } from 'api/search-conv-soap-api';
import { SearchConvRequest } from 'types/soap/search-conv';

describe('searchConvSoapApi', () => {
	test('should not send recip, ignored when every message is fetched', async () => {
		const interceptor = createSoapAPIInterceptor<SearchConvRequest>('SearchConv');

		searchConvSoapApi({ conversationId: '1', folderId: FOLDERS.INBOX, fetch: 'all', html: true });

		const req = await interceptor;
		expect(req).not.toHaveProperty('recip');
	});

	test('the max property is set to 250_000', async () => {
		const interceptor = createSoapAPIInterceptor<SearchConvRequest>('SearchConv');

		searchConvSoapApi({ conversationId: '1', folderId: FOLDERS.INBOX, fetch: 'all', html: true });

		const req = await interceptor;
		expect(req.max).toBe(250000);
	});

	test('should include read=1 when read parameter is true', async () => {
		const interceptor = createSoapAPIInterceptor<SearchConvRequest>('SearchConv');

		searchConvSoapApi({
			conversationId: '1',
			folderId: FOLDERS.INBOX,
			fetch: 'all',
			shouldMarkAsRead: true,
			html: true
		});

		const req = await interceptor;
		expect(req.read).toBe(1);
	});

	test('should NOT include read parameter when read is false', async () => {
		const interceptor = createSoapAPIInterceptor<SearchConvRequest>('SearchConv');

		searchConvSoapApi({
			conversationId: '1',
			folderId: FOLDERS.INBOX,
			fetch: 'all',
			shouldMarkAsRead: false,
			html: true
		});

		const req = await interceptor;
		expect(req.read).toBeUndefined();
	});

	test('should NOT include read parameter when read is not provided', async () => {
		const interceptor = createSoapAPIInterceptor<SearchConvRequest>('SearchConv');

		searchConvSoapApi({ conversationId: '1', folderId: FOLDERS.INBOX, fetch: 'all', html: true });

		const req = await interceptor;
		expect(req.read).toBeUndefined();
	});

	it('should resolve with the Fault when the server returns one', async () => {
		const fault = buildSoapErrorResponseBody({
			detailCode: 'mail.NO_SUCH_CONV',
			reason: 'no such item: 123'
		});
		createAPIInterceptor(
			'post',
			'/service/soap/SearchConvRequest',
			HttpResponse.json({ Body: fault })
		);

		const result = await searchConvSoapApi({ conversationId: '123', fetch: 'all', html: true });

		expect(result).toEqual(fault);
	});
});
