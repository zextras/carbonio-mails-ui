/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { renderHook, waitFor } from '@testing-library/react';
import { HttpResponse } from 'msw';

import {
	createAPIInterceptor,
	createSoapAPIInterceptor
} from '@test-utils/network/msw/create-api-interceptor';
import { getIncomingFiltersSoapApi } from 'api/get-incoming-filters-soap-api';
import { createSoapAPIInterceptorWithError } from '__test__/generators/api';

describe('getIncomingFiltersSoapApi', () => {
	it('should fetch filter rules using soapFetch and normalize them', async () => {
		const response = { filterRules: { filterRules: 'value' } };
		const interceptor = createSoapAPIInterceptor('GetFilterRules', response);

		const { result } = renderHook(() => getIncomingFiltersSoapApi());
		const request = await interceptor;

		expect(request).toEqual({ _jsns: 'urn:zimbraMail' });
		await waitFor(async () => {
			expect(await result.current).toMatchObject({ filterRules: [{ filterRule: [] }] });
		});
	});

	it('should return empty filter rules if the call fails', async () => {
		const interceptor = createSoapAPIInterceptorWithError('GetFilterRules');
		const { result } = renderHook(() => getIncomingFiltersSoapApi());
		await interceptor;

		await waitFor(async () => {
			expect(await result.current).toMatchObject({ filterRules: [{ filterRule: [] }] });
		});
	});

	it('should throw a warning if the api responds with 500', async () => {
		createAPIInterceptor('post', '/service/soap/GetFilterRulesRequest', HttpResponse.error());

		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {
			'warning error';
		});
		getIncomingFiltersSoapApi();

		await waitFor(async () => {
			expect(warnSpy).toHaveBeenCalledTimes(1);
		});
	});
});
