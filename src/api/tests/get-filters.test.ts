/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { ErrorSoapBodyResponse } from '@zextras/carbonio-ui-soap-lib';

import { createSoapAPIInterceptor } from '@test-utils/network/msw/create-api-interceptor';
import { buildSoapErrorResponseBody } from '@test-utils/utils/soap';
import { getIncomingFilters, getOutgoingFilters } from 'api/get-filters';

describe('get filters', () => {
	it('getIncomingFilters rejects when the server returns a fault', async () => {
		createSoapAPIInterceptor<never, ErrorSoapBodyResponse>(
			'GetFilterRules',
			buildSoapErrorResponseBody()
		);

		await expect(getIncomingFilters()).rejects.toThrow();
	});

	it('getOutgoingFilters rejects when the server returns a fault', async () => {
		createSoapAPIInterceptor<never, ErrorSoapBodyResponse>(
			'GetOutgoingFilterRules',
			buildSoapErrorResponseBody()
		);

		await expect(getOutgoingFilters()).rejects.toThrow();
	});
});
