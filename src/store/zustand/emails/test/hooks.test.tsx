/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { renderHook, waitFor } from '@testing-library/react';

import { createSoapAPIInterceptor } from '../../../../carbonio-ui-commons/test/mocks/network/msw/create-api-interceptor';
import { API_REQUEST_STATUS } from '../../../../constants';
import {
	generateCompleteMessageFromAPI,
	generateConvMessageFromAPI
} from '../../../../tests/generators/api';
import { generateConversation } from '../../../../tests/generators/generateConversation';
import { generateMessage } from '../../../../tests/generators/generateMessage';
import {
	ConvMessage,
	GetMsgRequest,
	GetMsgResponse,
	SearchConvRequest,
	SearchConvResponse
} from '../../../../types';
import { useCompleteConversation, useCompleteMessage } from '../hooks/hooks';
import {
	deleteMessagesFromConversation,
	setConversationsInEmailStore,
	setSearchResultsByConversation,
	setSearchResultsByMessage,
	updateConversationStatus,
	updateMessageStatus,
	useConversationById,
	useConversationStatus,
	useMessageStatus
} from '../store';

describe('Searches store hooks', () => {
	describe('useCompleteConversation', () => {
		it('should retrieve the conversation if no data available', async () => {
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

			const { result } = renderHook(() => useCompleteConversation('123', '2'));

			expect(result.current.conversation).toMatchObject({ id: '123' });
			await waitFor(() => {
				expect(result.current.conversationStatus).toBe('fulfilled');
			});
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

			const { result } = renderHook(() => useConversationStatus('123'));
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

			createSoapAPIInterceptor<SearchConvRequest, SearchConvResponse>('SearchConv', response);

			const { result } = renderHook(() => useConversationStatus('123'));
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

			const { result } = renderHook(() => useMessageStatus('1'));
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

			createSoapAPIInterceptor<GetMsgRequest, GetMsgResponse>('GetMsg', response);

			const { result } = renderHook(() => useMessageStatus('1'));
			renderHook(() => useCompleteMessage('1'));
			await waitFor(() => {
				expect(result.current).toBe(API_REQUEST_STATUS.pending);
			});
		});
	});

	describe('deleteMessagesFromConversation', () => {
		describe('When called with valid message IDs', () => {
			it('should delete the specified messages from the conversation', () => {
				const conversation = generateConversation({ id: '123' });
				const messages = [{ id: '1' }, { id: '2' }] as Array<ConvMessage>;
				setConversationsInEmailStore([{ ...conversation, messages }], false);
				deleteMessagesFromConversation(['1']);
				const { result } = renderHook(() => useConversationById('123'));
				expect(result.current.messages).toHaveLength(1);
			});

			it('should not affect other messages in the conversations');
		});

		// describe('When called with an empty array of IDs', () => {
		// 	it('should not modify any messages in the conversations');
		// });
		//
		// describe('When called with non-existent message IDs', () => {
		// 	it('should not delete any messages from the conversations');
		// 	it('should not throw an error');
		// });
		//
		// describe('When conversations have no messages', () => {
		// 	it('should not throw an error');
		// 	it('should leave the state unchanged');
		// });
		//
		// describe('When the conversations array is empty', () => {
		// 	it('should not throw an error');
		// 	it('should leave the state unchanged');
		// });
		//
		// describe('When called with null or undefined as IDs', () => {
		// 	it('should throw an appropriate error');
		// });
		//
		// describe('When useEmailsStore is invalid or undefined', () => {
		// 	it('should throw an appropriate error');
		// });
		//
		// describe('Performance and scalability', () => {
		// 	it('should handle a large number of message IDs efficiently');
		// 	it('should handle a large number of conversations and messages efficiently');
		// });
	});
});
