/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { act, renderHook, waitFor } from '@testing-library/react';
import { map } from 'lodash';

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
	useConversationIndexSlice,
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
				const { result: initialValue } = renderHook(() => useConversationById('123'));
				expect(initialValue.current.messages).toHaveLength(2);
				act(() => {
					deleteMessagesFromConversation(['1', '2']);
				});
				const { result } = renderHook(() => useConversationById('123'));
				expect(result.current.messages).toHaveLength(0);
			});

			it('should not affect other messages in the conversation', () => {
				const conversation = generateConversation({ id: '123' });
				const messages = [{ id: '1' }, { id: '2' }, { id: '3' }] as Array<ConvMessage>;
				setConversationsInEmailStore([{ ...conversation, messages }], false);
				const { result: initialValue } = renderHook(() => useConversationById('123'));
				expect(initialValue.current.messages).toHaveLength(3);
				act(() => {
					deleteMessagesFromConversation(['1', '2']);
				});
				const { result } = renderHook(() => useConversationById('123'));
				expect(result.current.messages).toHaveLength(1);
				expect(result.current.messages[0].id).toBe('3');
			});
		});

		describe('When called with an empty array of IDs', () => {
			it('should not modify any messages in the conversations', () => {
				const conversation = generateConversation({ id: '123' });
				const messages = [{ id: '1' }, { id: '2' }, { id: '3' }] as Array<ConvMessage>;
				setConversationsInEmailStore([{ ...conversation, messages }], false);
				const { result: initialValue } = renderHook(() => useConversationById('123'));
				expect(initialValue.current.messages).toHaveLength(3);
				act(() => {
					deleteMessagesFromConversation([]);
				});
				const { result } = renderHook(() => useConversationById('123'));
				expect(result.current.messages).toHaveLength(3);
			});
		});

		describe('When called with non-existent message IDs', () => {
			it('should not delete any messages from the conversations', () => {
				const conversation = generateConversation({ id: '123' });
				const messages = [{ id: '1' }, { id: '2' }, { id: '3' }] as Array<ConvMessage>;
				setConversationsInEmailStore([{ ...conversation, messages }], false);
				const { result: initialValue } = renderHook(() => useConversationById('123'));
				expect(initialValue.current.messages).toHaveLength(3);
				act(() => {
					deleteMessagesFromConversation(['4', '5']);
				});
				const { result } = renderHook(() => useConversationById('123'));
				expect(result.current.messages).toHaveLength(3);
			});
		});

		describe('When conversations have no messages', () => {
			it('should leave the state unchanged', () => {
				const conversation = generateConversation({ id: '123' });
				const messages = [] as Array<ConvMessage>;
				setConversationsInEmailStore([{ ...conversation, messages }], false);
				const { result: initialValue } = renderHook(() => useConversationById('123'));
				expect(initialValue.current.messages).toHaveLength(0);
				act(() => {
					deleteMessagesFromConversation(['1', '2']);
				});
				const { result } = renderHook(() => useConversationById('123'));
				expect(result.current).toMatchObject(expect.objectContaining({ id: '123', messages: [] }));
			});
		});

		describe('When the conversations array is empty', () => {
			it('should leave the state unchanged', () => {
				setConversationsInEmailStore([], false);
				act(() => {
					deleteMessagesFromConversation(['1', '2']);
				});
				const { result } = renderHook(() => useConversationIndexSlice());
				expect(result.current.conversationListIndex).toHaveLength(0);
			});
		});

		describe('Performance and scalability', () => {
			it('should handle a large number of conversations efficiently', () => {
				const numberOfConversations = 1000;
				const conversaiontIds = Array.from({ length: numberOfConversations }, (_, index) =>
					index.toString()
				);
				const conversations = map(conversaiontIds, (id) =>
					generateConversation({ id, messages: [{ id: '1' } as ConvMessage] })
				);
				setConversationsInEmailStore(conversations, false);
				const start = performance.now();
				act(() => {
					deleteMessagesFromConversation(['1', '2']);
				});
				const end = performance.now();
				expect(end - start).toBeLessThan(10);
			});
			it('should handle a large number of conversations and messages efficiently', () => {
				const numberOfMessages = 1000;
				const numberOfConversations = 1000;
				const messageIds = Array.from({ length: numberOfMessages }, (_, index) => index.toString());
				const conversaiontIds = Array.from({ length: numberOfConversations }, (_, index) =>
					index.toString()
				);
				const messages = map(messageIds, (id) => ({ id }));
				const conversations = map(conversaiontIds, (id) =>
					generateConversation({ id, messages: messages as Array<ConvMessage> })
				);
				setConversationsInEmailStore(conversations, false);
				const start = performance.now();
				act(() => {
					deleteMessagesFromConversation(['1']);
				});
				const end = performance.now();
				expect(end - start).toBeLessThan(10);
			});
		});
	});
});
