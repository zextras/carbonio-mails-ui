/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { waitFor } from '@testing-library/react';
import { HttpResponse } from 'msw';

import { createAPIInterceptor } from '../../carbonio-ui-commons/test/mocks/network/msw/create-api-interceptor';
import { setupHook } from '../../carbonio-ui-commons/test/test-setup';
import { generateStore } from '../../tests/generators/store';
import { GetMsgRequest } from '../../types';
import { useRequestDebouncedMessage } from '../use-request-debounced-message';

describe('useRequestDebouncedMessage', () => {
	afterEach(() => {
		jest.clearAllMocks();
	});

	it('should dispatch getMsgAsyncThunk with the correct messageId', async () => {
		const store = generateStore();

		const interceptor = createAPIInterceptor(
			'post',
			'/service/soap/GetMsgRequest',
			HttpResponse.json({})
		);
		setupHook(() => useRequestDebouncedMessage('test-message-id'), { store });

		await waitFor(() => expect(interceptor.getCalledTimes()).toBe(1));
		const getMessageRequest = (await interceptor.getLastRequest().json()) as {
			Body: { GetMsgRequest: GetMsgRequest };
		};
		expect(getMessageRequest.Body.GetMsgRequest.m.id).toBe('test-message-id');
	});

	it('should not dispatch getMsgAsyncThunk if isComplete is true', async () => {
		const store = generateStore();

		const interceptor = createAPIInterceptor(
			'post',
			'/service/soap/GetMsgRequest',
			HttpResponse.json({})
		);
		setupHook(() => useRequestDebouncedMessage('test-message-id', true), {
			store
		});

		await waitFor(() => expect(interceptor.getCalledTimes()).toBe(0));
	});
});
