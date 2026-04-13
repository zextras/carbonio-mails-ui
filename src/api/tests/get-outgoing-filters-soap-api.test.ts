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
import { getOutgoingFiltersSoapApi } from 'api/get-outgoing-filters-soap-api';
import { createSoapAPIInterceptorWithError } from '__test__/generators/api';

describe('getOutgoingFiltersSoapApi', () => {
	it('should fetch filter rules using soapFetch', async () => {
		const response = { filterRules: { filterRules: 'value' } };
		const interceptor = createSoapAPIInterceptor('GetOutgoingFilterRules', response);

		const { result } = renderHook(() => getOutgoingFiltersSoapApi());
		const request = await interceptor;

		expect(request).toEqual({ _jsns: 'urn:zimbraMail' });
		await waitFor(async () => {
			expect(await result.current).toMatchObject(response);
		});
	});

	it('should return empty filter rules if the call fails', async () => {
		const interceptor = createSoapAPIInterceptorWithError('GetOutgoingFilterRules');
		const { result } = renderHook(() => getOutgoingFiltersSoapApi());
		await interceptor;

		await waitFor(async () => {
			expect(await result.current).toMatchObject({ filterRules: [{ filterRule: [] }] });
		});
	});

	it('should throw a warning if the api responds with 500', async () => {
		createAPIInterceptor(
			'post',
			'/service/soap/GetOutgoingFilterRulesRequest',
			HttpResponse.error()
		);

		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {
			'warning error';
		});
		getOutgoingFiltersSoapApi();

		await waitFor(async () => {
			expect(warnSpy).toHaveBeenCalledTimes(1);
		});
	});
});
