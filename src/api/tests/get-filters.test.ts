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
import { getIncomingFilters, getOutgoingFilters } from 'api/get-filters';

describe('get filters', () => {
	it('getIncomingFilters rejects when the server returns a fault', async () => {
		createAPIInterceptor(
			'post',
			'/service/soap/GetFilterRulesRequest',
			HttpResponse.json({ Body: buildSoapErrorResponseBody() })
		);

		await expect(getIncomingFilters()).rejects.toBeInstanceOf(GenericSoapApiError);
	});

	it('getOutgoingFilters rejects when the server returns a fault', async () => {
		createAPIInterceptor(
			'post',
			'/service/soap/GetOutgoingFilterRulesRequest',
			HttpResponse.json({ Body: buildSoapErrorResponseBody() })
		);

		await expect(getOutgoingFilters()).rejects.toBeInstanceOf(GenericSoapApiError);
	});

	it('getOutgoingFilters returns the rules when there is no fault', async () => {
		const filterRules = [{ filterRule: [{ name: 'rule', active: true }] }];
		createSoapAPIInterceptor('GetOutgoingFilterRules', { filterRules });

		await expect(getOutgoingFilters()).resolves.toEqual({ filterRules });
	});
});
