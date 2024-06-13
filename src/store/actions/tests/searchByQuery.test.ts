/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createSoapAPIInterceptor } from '../../../carbonio-ui-commons/test/mocks/network/msw/create-api-interceptor';
import { generateStore } from '../../../tests/generators/store';
import { SearchRequest } from '../../../types';
import { searchByQuery } from '../searchByQuery';

describe('searchByQuery', () => {
	test('should invoke fetchSearchesFulfilled on fullFilled', async () => {
		const store = generateStore();
		const interceptor = createSoapAPIInterceptor<SearchRequest>('Search');

		const query = 'aaaaaa';
		await store
			.dispatch(
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				searchByQuery({ query })
			)
			.then(() => {
				expect(store.getState().searches.query).toBe(query);
			});
		const request = await interceptor;
		expect(request.query).toBe(query);
	});
});
