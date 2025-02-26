/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createSoapAPIInterceptor } from '../../../../carbonio-ui-commons/test/mocks/network/msw/create-api-interceptor';
import {
	generateConversationFromAPI,
	generateConvMessageFromAPI
} from '../../../../tests/generators/api';
import { GetConvResponse } from '../../../../types/soap/get-conv';
import { createOrUpdateConversations, createOrUpdateMessages } from '../../store';
import { getConvEmailStoreAction } from '../get-conv-action';

jest.mock('../../store', () => ({
	...jest.requireActual('../../store'),
	createOrUpdateMessages: jest.fn(),
	createOrUpdateConversations: jest.fn()
}));

describe('getConvEmailStoreAction', () => {
	it('should fetch conversation data and update the store', async () => {
		const message = generateConvMessageFromAPI({ id: '1', l: '2' });
		const conversation = generateConversationFromAPI({ id: '123', m: [message] });

		const response: GetConvResponse = {
			c: [conversation]
		};

		const interceptor = createSoapAPIInterceptor('GetConv', response);

		await getConvEmailStoreAction({
			id: '123'
		});

		const request = await interceptor;

		expect(request).toEqual(
			expect.objectContaining({
				c: expect.objectContaining({ id: '123' })
			})
		);
		expect(createOrUpdateMessages).toHaveBeenCalledTimes(1);
		expect(createOrUpdateConversations).toHaveBeenCalledTimes(1);
	});
});
