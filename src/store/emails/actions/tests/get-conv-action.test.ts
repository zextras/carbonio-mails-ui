/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { renderHook } from '@testing-library/react';

import { createSoapAPIInterceptor } from '@test-utils/network/msw/create-api-interceptor';
import { generateConversationFromAPI, generateConvMessageFromAPI } from '__test__/generators/api';
import { getConvEmailStoreAction } from 'store/emails/actions/get-conv-action';
import { useConversationById } from 'store/emails/store';
import { GetConvResponse } from 'types/soap/get-conv';

describe('getConvEmailStoreAction', () => {
	it('should fetch conversation data and update the store', async () => {
		const message = generateConvMessageFromAPI({ id: '1', l: '2' });
		const conversation = generateConversationFromAPI({ id: '123', m: [message] });

		const response: GetConvResponse = {
			c: [conversation]
		};

		const interceptor = createSoapAPIInterceptor('GetConv', response);

		await getConvEmailStoreAction({
			id: '123',
			html: true
		});

		const request = await interceptor;

		expect(request).toEqual(
			expect.objectContaining({
				c: expect.objectContaining({ id: '123' })
			})
		);
		const { result } = renderHook(() => useConversationById('123'));
		expect(result.current).not.toBeUndefined();
		// TODO: redefine this hook and expect actual output, avoid spying store.
		//  The store may as well not exist, so what is the role of this function?
	});
});
