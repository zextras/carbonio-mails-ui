/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { HttpResponse } from 'msw';

import App from './app';
import { createAPIInterceptor } from './carbonio-ui-commons/test/mocks/network/msw/create-api-interceptor';
import { setupTest } from './carbonio-ui-commons/test/test-setup';

describe('App', () => {
	it('renders without crashing', async () => {
		const interceptor = createAPIInterceptor(
			'/zx/auth/supported',
			HttpResponse.json(null, { status: 500 })
		);
		setupTest(<App />, {});
		await interceptor;
	});
});
