/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createSoapAPIInterceptor } from '@test-utils/network/msw/create-api-interceptor';
import {
	modifyFilterRulesSoapApi,
	modifyOutgoingFilterRulesSoapApi
} from 'api/modify-filter-rules-soap-api';
import { createSoapAPIInterceptorWithError } from 'tests/generators/api';

describe('modifyFilterRulesSoapApi', () => {
	it('should call soapFetch with correct params', async () => {
		const interceptor = createSoapAPIInterceptor('ModifyFilterRules');
		await modifyFilterRulesSoapApi([{ name: 'rule1' }]);
		const request: any = await interceptor;
		expect(request.filterRules).toEqual([{ filterRule: [{ name: 'rule1' }] }]);
	});

	it('handles error during filter rule modification', async () => {
		const interceptor = createSoapAPIInterceptorWithError('ModifyFilterRules', true);
		await modifyFilterRulesSoapApi([{ name: 'rule1' }]);
		expect(interceptor).rejects.toThrow();
	});
});

describe('modifyOutgoingFilterRulesSoapApi', () => {
	it('should call soapFetch with correct params', async () => {
		const interceptor = createSoapAPIInterceptor('ModifyOutgoingFilterRules');
		await modifyOutgoingFilterRulesSoapApi([{ name: 'rule1' }]);
		const request: any = await interceptor;
		expect(request.filterRules).toEqual([{ filterRule: [{ name: 'rule1' }] }]);
	});

	it('handles error during outgoing filter rule modification', async () => {
		const interceptor = createSoapAPIInterceptorWithError('ModifyOutgoingFilterRules', true);
		await modifyOutgoingFilterRulesSoapApi([{ name: 'rule1' }]);
		expect(interceptor).rejects.toThrow();
	});
});
