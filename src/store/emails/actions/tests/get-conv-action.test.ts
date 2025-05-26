/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createSoapAPIInterceptor } from '@zextras/carbonio-ui-commons';
import {
	generateConversationFromAPI,
	generateConvMessageFromAPI
} from '../../../../tests/generators/api';
import { GetConvResponse } from '../../../../types/soap/get-conv';
import { updateConversations, updateMessages } from '../../store';
import { getConvEmailStoreAction } from '../get-conv-action';

jest.mock('../../store', () => ({
	...jest.requireActual('../../store'),
	updateMessages: jest.fn(),
	updateConversations: jest.fn()
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
		expect(updateMessages).toHaveBeenCalledTimes(1);
		expect(updateConversations).toHaveBeenCalledTimes(1);
	});
});
