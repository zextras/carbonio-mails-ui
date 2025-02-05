/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { HttpResponse } from 'msw';

import { createAPIInterceptor } from '../../carbonio-ui-commons/test/mocks/network/msw/create-api-interceptor';
import { checkPersonalCertificateExist } from '../check-personal-certificate-exist-api';

const checkPersonalCertificateExistEndpoint = '/service/extension/encryption/smime/personal/exist';
describe('checkPersonalCertificateExist', () => {
	it('returns data when certificate exists', async () => {
		createAPIInterceptor(
			'post',
			checkPersonalCertificateExistEndpoint,
			HttpResponse.json({}, { status: 200 })
		);
		const result = await checkPersonalCertificateExist('correct-password', 'test@example.com');
		expect(result).toHaveProperty('data');
	});

	it('returns error when certificate does not exist', async () => {
		createAPIInterceptor(
			'post',
			checkPersonalCertificateExistEndpoint,
			HttpResponse.json({}, { status: 404 })
		);
		const result = await checkPersonalCertificateExist('wrong-password', 'test@example.com');
		expect(result).toHaveProperty('error');
	});
});
