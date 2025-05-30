/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { HttpResponse } from 'msw';

import { createAPIInterceptor } from '@test-utils/network/msw/create-api-interceptor';
import { checkExistEncryptionPassword } from 'api/check-exist-password-api';

const api = '/service/extension/encryption/password/exist';
describe('checkExistEncryptionPassword', () => {
	describe('when the api call succeeds', () => {
		beforeEach(() => {
			createAPIInterceptor('get', api, HttpResponse.json({}, { status: 200 }));
		});

		it('should return data', async () => {
			expect(await checkExistEncryptionPassword()).toEqual({ data: {} });
		});
	});

	describe('when the api call returns non-200 status', () => {
		beforeEach(() => {
			createAPIInterceptor('get', api, HttpResponse.json({}, { status: 404 }));
		});

		it('should return error', async () => {
			expect(await checkExistEncryptionPassword()).toEqual({ error: '' });
		});
	});
});
