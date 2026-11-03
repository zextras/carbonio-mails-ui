/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
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
import {
	ModifyFilterRulesRequest,
	modifyFilterRulesSoapApi,
	modifyOutgoingFilterRulesSoapApi
} from 'api/modify-filter-rules-soap-api';
import type { Filter } from 'types/filters';

const rule: Filter = { name: 'rule1', active: true, filterTests: [], filterActions: [] };

describe.each([
	['ModifyFilterRules', modifyFilterRulesSoapApi],
	['ModifyOutgoingFilterRules', modifyOutgoingFilterRulesSoapApi]
] as const)('%s', (request, api) => {
	it('sends the rules', async () => {
		const interceptor = createSoapAPIInterceptor<ModifyFilterRulesRequest, { _jsns: string }>(
			request,
			{
				_jsns: 'urn:zimbraMail'
			}
		);

		await expect(api([rule])).resolves.toBeUndefined();
		await expect(interceptor).resolves.toEqual({
			filterRules: [{ filterRule: [rule] }],
			_jsns: 'urn:zimbraMail'
		});
	});

	it('rejects when the server returns a fault', async () => {
		createAPIInterceptor(
			'post',
			`/service/soap/${request}Request`,
			HttpResponse.json({ Body: buildSoapErrorResponseBody() })
		);

		await expect(api([rule])).rejects.toBeInstanceOf(GenericSoapApiError);
	});
});
