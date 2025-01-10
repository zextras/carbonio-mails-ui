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
} from '../../carbonio-ui-commons/test/mocks/network/msw/create-api-interceptor';
import { createSoapAPIInterceptorWithError } from '../../tests/generators/api';
import { getShareInfoSoapApi } from '../get-share-info-soap-api';

describe('getShareInfoSoapApi', () => {
	it('should return a getShareInfoResponse', async () => {
		const response = { share: { view: 'value' } };
		const interceptor = createSoapAPIInterceptor('GetShareInfo', response);

		const { result } = renderHook(() => getShareInfoSoapApi());
		const request = await interceptor;

		expect(request).toEqual({ _jsns: 'urn:zimbraAccount', includeSelf: 0 });
		await waitFor(async () => {
			expect(await result.current).toMatchObject(response);
		});
	});

	it('should return empty share response if the call fails', async () => {
		const interceptor = createSoapAPIInterceptorWithError('GetShareInfo');
		const { result } = renderHook(() => getShareInfoSoapApi());
		await interceptor;

		await waitFor(async () => {
			expect(await result.current).toMatchObject({ share: {} });
		});
	});

	it('should throw a warning if the api responds with 500', async () => {
		createAPIInterceptor(
			'post',
			'/service/soap/GetShareInfoRequest',
			HttpResponse.json({}, { type: 'error', status: 500, statusText: 'Failed' })
		);

		const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {
			'warning error';
		});
		getShareInfoSoapApi();

		await waitFor(async () => {
			expect(warnSpy).toHaveBeenCalledTimes(1);
		});
	});
});
