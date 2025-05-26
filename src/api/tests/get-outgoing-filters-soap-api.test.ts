/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { renderHook, waitFor } from '@testing-library/react';
import { HttpResponse } from 'msw';

import { createAPIInterceptor, createSoapAPIInterceptor } from '@zextras/carbonio-ui-commons';
import { createSoapAPIInterceptorWithError } from '../../tests/generators/api';
import { getOutgoingFiltersSoapApi } from '../get-outgoing-filters-soap-api';

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
			HttpResponse.json({}, { type: 'error', status: 500, statusText: 'Failed' })
		);

		const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {
			'warning error';
		});
		getOutgoingFiltersSoapApi();

		await waitFor(async () => {
			expect(warnSpy).toHaveBeenCalledTimes(1);
		});
	});
});
