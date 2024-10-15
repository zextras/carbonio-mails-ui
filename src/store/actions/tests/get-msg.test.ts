/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createSoapAPIInterceptor } from '../../../carbonio-ui-commons/test/mocks/network/msw/create-api-interceptor';
import { generateCompleteMessageFromAPI } from '../../../tests/generators/api';
import { generateStore } from '../../../tests/generators/store';
import { GetMsgRequest, GetMsgResponse } from '../../../types';
import { getFullMsgAsyncThunk, getMsgAsyncThunk } from '../get-msg-async-thunk';

describe('Get Message', () => {
	describe('Get Message Async Thunk', () => {
		it('should call api with max 250k', async () => {
			const store = generateStore();
			const interceptor = createSoapAPIInterceptor<GetMsgRequest>('GetMsg');
			const msgId = '1';
			await store.dispatch(
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				getMsgAsyncThunk({ msgId })
			);
			const request = await interceptor;
			expect(request.m.max).toBe(250000);
		});

		it('should update store', async () => {
			const store = generateStore();
			const msgId = '1';
			const subject = 'New subject';
			const interceptor = createSoapAPIInterceptor<GetMsgRequest, GetMsgResponse>('GetMsg', {
				m: [generateCompleteMessageFromAPI({ id: msgId, su: subject })]
			});

			await store.dispatch(
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				getMsgAsyncThunk({ msgId })
			);
			await interceptor;
			expect(store.getState().messages.messages[msgId].subject).toBe(subject);
		});
	});

	describe('Get Full Message Async Thunk', () => {
		it('should call api without max', async () => {
			const store = generateStore();
			const interceptor = createSoapAPIInterceptor<GetMsgRequest>('GetMsg');
			const msgId = '1';
			await store.dispatch(
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				getFullMsgAsyncThunk({ msgId })
			);
			const request = await interceptor;
			expect(request.m.max).not.toBeDefined();
		});

		it('should update store', async () => {
			const store = generateStore();
			const msgId = '1';
			const subject = 'New subject';
			const interceptor = createSoapAPIInterceptor<GetMsgRequest, GetMsgResponse>('GetMsg', {
				m: [generateCompleteMessageFromAPI({ id: msgId, su: subject })]
			});

			await store.dispatch(
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				getFullMsgAsyncThunk({ msgId })
			);
			await interceptor;
			expect(store.getState().messages.messages[msgId].subject).toBe(subject);
		});
	});
});
