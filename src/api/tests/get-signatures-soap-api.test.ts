/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createSoapAPIInterceptor } from '@test-utils/network/msw/create-api-interceptor';
import { GetSignaturesSoapApi } from 'api/get-signatures-soap-api';
import { getSignaturesEmptyResponse } from 'api/tests/fixtures/get-signatures-empty-response';

describe('GetSignaturesSoapApi', () => {
	it('returns an empty list when the account has no signatures', async () => {
		createSoapAPIInterceptor('GetSignatures', getSignaturesEmptyResponse);

		const { signature } = await GetSignaturesSoapApi();

		expect(signature).toEqual([]);
	});
});
