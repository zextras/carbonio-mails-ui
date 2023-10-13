/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { rest } from 'msw';

import { getSetupServer } from '../../../carbonio-ui-commons/test/jest-setup';
import { FOLDERS } from '../../../carbonio-ui-commons/test/mocks/carbonio-shell-ui-constants';
import { generateStore } from '../../../tests/generators/store';
import { SoapDraftMessageObj } from '../../../types';
import { searchConv } from '../search-conv';

describe('searchConv', () => {
	test('the max property is not set', async () => {
		// Generate the state store
		const store = generateStore();

		const interceptor = new Promise<SoapDraftMessageObj>((resolve, reject) => {
			// Register a handler for the REST call
			getSetupServer().use(
				rest.post('/service/soap/SearchConvRequest', async (req, res, ctx) => {
					if (!req) {
						reject(new Error('Empty request'));
					}

					const requestFields = (await req.json()).Body.SearchConvRequest;
					resolve(requestFields);

					// Don't care about the actual response
					return res(ctx.json({}));
				})
			);
		});

		store.dispatch(
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			searchConv({ conversationId: '1', folderId: FOLDERS.INBOX, fetch: 'all' })
		);

		const req = await interceptor;
		expect('max' in req).toBeFalsy();
	});
});
