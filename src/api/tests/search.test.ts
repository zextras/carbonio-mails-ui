/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createSoapAPIInterceptor } from '../../carbonio-ui-commons/test/mocks/network/msw/create-api-interceptor';
import { SearchRequest } from '../../types';
import { searchSoapApi } from '../search';

describe('Search', () => {
	it('should send dateDesc filter if readDesc', async () => {
		const interceptor = createSoapAPIInterceptor<SearchRequest>('Search');

		searchSoapApi({
			query: 'aaa',
			limit: 10,
			sortBy: 'readDesc'
		});

		const receivedRequest = await interceptor;
		expect(receivedRequest.sortBy).toBe('dateDesc');
	});

	it('should send dateAsc filter if readAsc', async () => {
		const interceptor = createSoapAPIInterceptor<SearchRequest>('Search');

		searchSoapApi({
			query: 'aaa',
			limit: 10,
			sortBy: 'readAsc'
		});

		const receivedRequest = await interceptor;
		expect(receivedRequest.sortBy).toBe('dateAsc');
	});
});
