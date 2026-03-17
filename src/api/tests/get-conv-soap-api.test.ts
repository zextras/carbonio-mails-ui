/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { waitFor } from '@testing-library/react';

import { createSoapAPIInterceptor } from '@test-utils/network/msw/create-api-interceptor';
import { generateConversationFromAPI, generateConvMessageFromAPI } from '__test__/generators/api';
import { getConvSoapApi } from 'api/get-conv-soap-api';
import { GetConvResponse } from 'types/soap/get-conv';

describe('getConvSoapApi', () => {
	it('should fetch with the correct parameters', async () => {
		const response: GetConvResponse = {
			c: [generateConversationFromAPI({ id: '123' })]
		};
		const interceptor = createSoapAPIInterceptor('GetConv', response);
		getConvSoapApi({
			conversationId: '123',
			html: true
		});
		const request = await interceptor;

		expect(request).toEqual({
			_jsns: 'urn:zimbraMail',
			c: {
				id: '123',
				html: true,
				needExp: 1,
				header: expect.any(Array),
				fetch: 'all'
			}
		});
	});

	it('should return normalized messages and conversation', async () => {
		const message = generateConvMessageFromAPI({ id: '1', l: '2' });
		const conversation = generateConversationFromAPI({ id: '123', m: [message] });
		const response: GetConvResponse = {
			c: [conversation]
		};
		createSoapAPIInterceptor('GetConv', response);
		const result = await getConvSoapApi({
			conversationId: '123',
			html: true
		});
		await waitFor(async () => {
			expect(result).toEqual({
				conversation: [expect.objectContaining({ id: '123' })],
				messages: [expect.objectContaining({ id: '1' })]
			});
		});
	});

	it('should call onConversationIdChange when conversation ID changes', async () => {
		const mockOnConversationIdChange = vi.fn();
		const conversation = generateConversationFromAPI({ id: '123' });
		const response: GetConvResponse = {
			c: [conversation]
		};
		createSoapAPIInterceptor('GetConv', response);
		await getConvSoapApi({
			conversationId: '-123',
			onConversationIdChange: mockOnConversationIdChange,
			html: true
		});
		await waitFor(async () => {
			expect(mockOnConversationIdChange).toHaveBeenCalledWith('123');
		});
	});

	it('should not call onConversationIdChange when conversation ID remains the same', async () => {
		const mockOnConversationIdChange = vi.fn();
		const conversation = generateConversationFromAPI({ id: '123' });
		const response: GetConvResponse = {
			c: [conversation]
		};
		createSoapAPIInterceptor('GetConv', response);
		await getConvSoapApi({
			conversationId: '123',
			onConversationIdChange: mockOnConversationIdChange,
			html: true
		});
		await waitFor(async () => {
			expect(mockOnConversationIdChange).not.toHaveBeenCalledWith('123');
		});
	});
});
