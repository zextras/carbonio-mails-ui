/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { GenericSoapApiError } from '@zextras/carbonio-ui-commons';
import { HttpResponse } from 'msw';

import {
	createAPIInterceptor,
	createSoapAPIInterceptor
} from '@test-utils/network/msw/create-api-interceptor';
import { buildSoapErrorResponseBody } from '@test-utils/utils/soap';
import { GetSignaturesSoapApi } from 'api/get-signatures-soap-api';
import { getSignaturesEmptyResponse } from 'api/tests/fixtures/get-signatures-empty-response';

describe('GetSignaturesSoapApi', () => {
	it('returns an empty list when the account has no signatures', async () => {
		createSoapAPIInterceptor('GetSignatures', getSignaturesEmptyResponse);

		const { signature } = await GetSignaturesSoapApi();

		expect(signature).toEqual([]);
	});

	it('rejects when the server returns a fault', async () => {
		createAPIInterceptor(
			'post',
			'/service/soap/GetSignaturesRequest',
			HttpResponse.json({ Body: buildSoapErrorResponseBody() })
		);

		await expect(GetSignaturesSoapApi()).rejects.toBeInstanceOf(GenericSoapApiError);
	});
});
