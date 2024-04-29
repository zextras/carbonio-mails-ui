/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { FOLDERS } from '../../../carbonio-ui-commons/test/mocks/carbonio-shell-ui-constants';
import { createSoapAPIInterceptor } from '../../../carbonio-ui-commons/test/mocks/network/msw/create-api-interceptor';
import { generateStore } from '../../../tests/generators/store';
import { SearchRequest } from '../../../types';
import { searchConv } from '../search-conv';

describe('searchConv', () => {
	test('the max property is not set', async () => {
		// Generate the state store
		const store = generateStore();
		const interceptor = createSoapAPIInterceptor<SearchRequest>('SearchConv');

		store.dispatch(
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			searchConv({ conversationId: '1', folderId: FOLDERS.INBOX, fetch: 'all' })
		);

		const req = await interceptor;
		expect('max' in req).toBeFalsy();
	});
});
