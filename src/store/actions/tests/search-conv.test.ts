/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { FOLDERS } from '../../../carbonio-ui-commons/constants/folders';
import { createSoapAPIInterceptor } from '../../../carbonio-ui-commons/test/mocks/network/msw/create-api-interceptor';
import { type SearchConvRequest } from '../../../types';
import { searchConv } from '../search-conv';

describe('searchConv', () => {
	test('the max property is set to 250_000', async () => {
		const interceptor = createSoapAPIInterceptor<SearchConvRequest>('SearchConv');

		searchConv({ conversationId: '1', folderId: FOLDERS.INBOX, fetch: 'all' });

		const req = await interceptor;
		expect(req.max).toBe(250000);
	});
});
