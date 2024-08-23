/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { renderHook } from '@testing-library/react-hooks';

import { createSoapAPIInterceptor } from '../../../../carbonio-ui-commons/test/mocks/network/msw/create-api-interceptor';
import { API_REQUEST_STATUS } from '../../../../constants';
import {
	generateCompleteMessageFromAPI,
	generateConvMessageFromAPI
} from '../../../../tests/generators/api';
import { generateConversation } from '../../../../tests/generators/generateConversation';
import { generateMessage } from '../../../../tests/generators/generateMessage';
import {
	GetMsgRequest,
	GetMsgResponse,
	SearchConvRequest,
	SearchConvResponse
} from '../../../../types';
import { useCompleteConversation, useCompleteMessage } from '../hooks/hooks';
import {
	setSearchResultsByConversation,
	setSearchResultsByMessage,
	updateConversationStatus,
	updateMessageStatus,
	useConversationStatus,
	useMessageStatus
} from '../store';

describe('Searches store hooks', () => {
	describe('useCompleteConversation', () => {
		it('should return undefined conversation and status if no data available', async () => {
			const { result } = renderHook(() => useCompleteConversation('123', '2'));

			expect(result.current.conversation).toBeUndefined();
			expect(result.current.conversationStatus).toBeUndefined();
		});

		it('should update conversation status if conversation status is undefined', async () => {
			const conversation = generateConversation({
				id: '123',
				messages: [generateMessage({ id: '1', subject: 'Test Message 1' })],
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

			const { result, waitFor } = renderHook(() => useConversationStatus('123'));
			renderHook(() => useCompleteConversation('123', '2'));
			await waitFor(() => {
				expect(result.current).toBe(API_REQUEST_STATUS.fulfilled);
			});
		});

		it('should not update conversation status if conversation status is already defined', async () => {
			const conversation = generateConversation({
				id: '123',
				messages: [generateMessage({ id: '1', subject: 'Test Message 1' })],
				subject: 'Test Conversation'
			});
			setSearchResultsByConversation([conversation], false);
			updateConversationStatus(conversation.id, API_REQUEST_STATUS.pending);
			const response: SearchConvResponse = {
				m: [generateConvMessageFromAPI({ id: '10' }), generateConvMessageFromAPI({ id: '2' })],
				more: false,
				offset: '',
				orderBy: ''
			};
			// TODO: find a way to check API not called
			createSoapAPIInterceptor<SearchConvRequest, SearchConvResponse>('SearchConv', response);

			const { result, waitFor } = renderHook(() => useConversationStatus('123'));
			renderHook(() => useCompleteConversation('123', '2'));
			await waitFor(() => {
				expect(result.current).toBe(API_REQUEST_STATUS.pending);
			});
		});
	});

	describe('useCompleteMessage', () => {
		it('should return undefined message and status if no data in store', async () => {
			const { result } = renderHook(() => useCompleteMessage('1'));

			expect(result.current.message).toBeUndefined();
			expect(result.current.messageStatus).toBeUndefined();
		});

		it('should update status if initial status is undefined', async () => {
			const message = generateMessage({
				id: '1',
				subject: 'Test Message'
			});
			setSearchResultsByMessage([message], false);
			const response: GetMsgResponse = {
				m: [generateCompleteMessageFromAPI({ id: '10' })]
			};
			createSoapAPIInterceptor<GetMsgRequest, GetMsgResponse>('GetMsg', response);

			const { result, waitFor } = renderHook(() => useMessageStatus('1'));
			renderHook(() => useCompleteMessage('1'));
			await waitFor(() => {
				expect(result.current).toBe(API_REQUEST_STATUS.fulfilled);
			});
		});

		it('should not update message status if message status is already defined', async () => {
			const message = generateMessage({
				id: '1',
				subject: 'Test Message'
			});
			setSearchResultsByMessage([message], false);
			updateMessageStatus(message.id, API_REQUEST_STATUS.pending);
			const response: GetMsgResponse = {
				m: [generateCompleteMessageFromAPI({ id: '1' })]
			};
			// TODO: find a way to check API not called
			createSoapAPIInterceptor<GetMsgRequest, GetMsgResponse>('GetMsg', response);

			const { result, waitFor } = renderHook(() => useMessageStatus('1'));
			renderHook(() => useCompleteMessage('1'));
			await waitFor(() => {
				expect(result.current).toBe(API_REQUEST_STATUS.pending);
			});
		});
	});
});
