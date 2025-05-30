/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { HttpResponse } from 'msw';

import { createAPIInterceptor } from '@test-utils/network/msw/create-api-interceptor';
import { checkEncryptionPassword } from 'api/check-password-api';

describe('checkEncryptionPassword', () => {
	it('returns data when password is correct', async () => {
		createAPIInterceptor(
			'post',
			'/service/extension/encryption/password/check',
			HttpResponse.json({ data: 'success' }, { status: 200 })
		);
		const result = await checkEncryptionPassword('correct-password');
		expect(result).toHaveProperty('data');
	});

	it('returns error when password is incorrect', async () => {
		createAPIInterceptor(
			'post',
			'/service/extension/encryption/password/check',
			HttpResponse.json({ data: 'error' }, { status: 404 })
		);
		const result = await checkEncryptionPassword('wrong-password');
		expect(result).toHaveProperty('error');
	});
});
