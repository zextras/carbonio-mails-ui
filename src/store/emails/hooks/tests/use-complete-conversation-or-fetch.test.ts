/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { renderHook, waitFor } from '@testing-library/react';

import { useCompleteConversationOrFetch } from '../use-complete-conversation-or-fetch';
import { createSoapAPIInterceptor } from '@test-utils/network/msw/create-api-interceptor';
import { generateConvMessageFromAPI } from '__test__/generators/api';
import { generateConversation } from '__test__/generators/generateConversation';
import { generateMessage } from '__test__/generators/generateMessage';
import { API_REQUEST_STATUS } from 'constants/index';
import {
	setSearchResultsByConversation,
	updateConversationStatus,
	useConversationStatus
} from 'store/emails/store';
import { SearchConvRequest, SearchConvResponse } from 'types';

describe('useCompleteConversationOrFetch', () => {
	it('should retrieve the conversation if no data available', async () => {
		const message = generateMessage({ id: '1', subject: 'Test Message 1' });
		const conversation = generateConversation({
			id: '123',
			messageIds: [message.id],
			subject: 'Test Conversation'
		});
		setSearchResultsByConversation([conversation], false);

		const response: SearchConvResponse = {
			m: [generateConvMessageFromAPI({ id: '10' }), generateConvMessageFromAPI({ id: '2' })],
			more: false,
			offset: '',
			orderBy: ''
		};
		createSoapAPIInterceptor<SearchConvRequest, SearchConvResponse>('SearchConv', response);

		const { result } = renderHook(() => useCompleteConversationOrFetch('123', '2'));

		expect(result.current.conversation).toMatchObject({ id: '123' });
		await waitFor(() => {
			expect(result.current.conversationStatus).toBe('fulfilled');
		});
	});

	it('should update conversation status if conversation status is undefined', async () => {
		const message = generateMessage({ id: '1', subject: 'Test Message 1' });
		const conversation = generateConversation({
			id: '123',
			messageIds: [message.id],
			subject: 'Test Conversation'
		});
		setSearchResultsByConversation([conversation], false);

		const response: SearchConvResponse = {
			m: [generateConvMessageFromAPI({ id: '10' }), generateConvMessageFromAPI({ id: '2' })],
			more: false,
			offset: '',
			orderBy: ''
		};
		createSoapAPIInterceptor<SearchConvRequest, SearchConvResponse>('SearchConv', response);

		const { result } = renderHook(() => useConversationStatus('123'));
		renderHook(() => useCompleteConversationOrFetch('123', '2'));
		await waitFor(() => {
			expect(result.current).toBe(API_REQUEST_STATUS.fulfilled);
		});
	});

	it('should not update conversation status if conversation status is already defined', async () => {
		const message = generateMessage({ id: '1', subject: 'Test Message 1' });
		const conversation = generateConversation({
			id: '123',
			messageIds: [message.id],
			subject: 'Test Conversation'
		});
		setSearchResultsByConversation([conversation], false);
		await waitFor(() => {
			updateConversationStatus(conversation.id, API_REQUEST_STATUS.pending);
		});
		const response: SearchConvResponse = {
			m: [generateConvMessageFromAPI({ id: '10' }), generateConvMessageFromAPI({ id: '2' })],
			more: false,
			offset: '',
			orderBy: ''
		};

		createSoapAPIInterceptor<SearchConvRequest, SearchConvResponse>('SearchConv', response);

		const { result } = renderHook(() => useConversationStatus('123'));
		renderHook(() => useCompleteConversationOrFetch('123', '2'));
		await waitFor(() => {
			expect(result.current).toBe(API_REQUEST_STATUS.pending);
		});
	});
});
