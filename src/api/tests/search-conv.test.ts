/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createSoapAPIInterceptor, FOLDERS } from '@zextras/carbonio-ui-commons';
import { SearchConvRequest } from '../../types';
import { searchConvSoapApi } from '../search-conv-soap-api';

describe('searchConvSoapApi', () => {
	test('the max property is set to 250_000', async () => {
		const interceptor = createSoapAPIInterceptor<SearchConvRequest>('SearchConv');

		searchConvSoapApi({ conversationId: '1', folderId: FOLDERS.INBOX, fetch: 'all' });

		const req = await interceptor;
		expect(req.max).toBe(250000);
	});
});
