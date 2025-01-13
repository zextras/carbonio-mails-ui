/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { act, renderHook, waitFor } from '@testing-library/react';
import { cloneDeep, map, reduce } from 'lodash';

import * as getMsg from '../../../../api/get-msg-soap-api';
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
	EmailsStoreState,
	GetMsgRequest,
	GetMsgResponse,
	NormalizedConversation,
	PopulatedItemsSliceState,
	SearchConvRequest,
	SearchConvResponse
} from '../../../../types';
import { CONVERSATION_INDEX_SLICE_INITIAL_STATE } from '../../conversations/conversations-index-slice';
import { MESSAGE_INDEX_SLICE_INITIAL_STATE } from '../../messages/messages-slice';
import { deleteMessagesFromConversation } from '../../populated-items/utils';
import { SEARCH_INDEX_SLICE_INITIAL_STATE } from '../../search/search-slice';
import {
	setMessagesInEmailStore,
	setSearchResultsByConversation,
	setSearchResultsByMessage,
	updateConversationStatus,
	updateMessageStatus,
	useConversationStatus,
	useMessageStatus
} from '../../store';
import { useCompleteConversationOrFetch, useCompleteMessageOrFetch } from '../hooks';

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

			const { result } = renderHook(() => useCompleteConversationOrFetch('123', '2'));

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
			renderHook(() => useCompleteConversationOrFetch('123', '2'));
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

	describe('useCompleteMessageOrFetch', () => {
		it('should make GetMsgRequest if message is not in the store', async () => {
			const response: GetMsgResponse = {
				m: [generateCompleteMessageFromAPI({ id: '1' })]
			};

			const interceptor = createSoapAPIInterceptor<GetMsgRequest, GetMsgResponse>(
				'GetMsg',
				response
			);

			renderHook(() => useCompleteMessageOrFetch('1'));

			const getMsgRequest = await interceptor;

			await act(async () => {
				expect(getMsgRequest).toMatchObject({ m: expect.objectContaining({ id: '1' }) });
			});
		});

		it('should fetch if the message is not complete', async () => {
			const message = generateMessage({ id: '1' });
			setMessagesInEmailStore([{ ...message, isComplete: false }], false);
			const getMsgSpy = jest.spyOn(getMsg, 'getMsgSoapApi');
			renderHook(() => useCompleteMessageOrFetch('1'));

			await act(async () => {
				expect(getMsgSpy).toHaveBeenCalled();
			});
		});

		it('should not fetch if the message is complete', async () => {
			const message = generateMessage({ id: '1' });
			setMessagesInEmailStore([{ ...message, isComplete: true }], false);
			const getMsgSpy = jest.spyOn(getMsg, 'getMsgSoapApi');
			renderHook(() => useCompleteMessageOrFetch('1'));

			await act(async () => {
				expect(getMsgSpy).not.toHaveBeenCalled();
			});
		});

		it('should fetch if the message is incomplete and status is not fulfilled or pending', async () => {
			const message = generateMessage({ id: '1' });
			setMessagesInEmailStore([{ ...message, isComplete: false }], false);
			updateMessageStatus('1', API_REQUEST_STATUS.error);
			const getMsgSpy = jest.spyOn(getMsg, 'getMsgSoapApi');
			renderHook(() => useCompleteMessageOrFetch('1'));

			await act(async () => {
				expect(getMsgSpy).toHaveBeenCalled();
			});
		});

		it('should not fetch if the message status is pending', async () => {
			const message = generateMessage({ id: '1' });
			setMessagesInEmailStore([{ ...message, isComplete: false }], false);
			await act(async () => {
				updateMessageStatus('1', API_REQUEST_STATUS.pending);
			});
			const { result } = renderHook(() => useMessageStatus('1'));
			expect(result.current).toBe(API_REQUEST_STATUS.pending);
			const getMsgSpy = jest.spyOn(getMsg, 'getMsgSoapApi');
			renderHook(() => useCompleteMessageOrFetch('1'));

			await act(async () => {
				expect(getMsgSpy).not.toHaveBeenCalled();
			});
		});

		it('should fetch a new message if messageId changes', async () => {
			const getMsgSpy = jest.spyOn(getMsg, 'getMsgSoapApi');
			const { rerender } = renderHook(({ id }) => useCompleteMessageOrFetch(id), {
				initialProps: { id: '1' }
			});

			await act(async () => {
				expect(getMsgSpy).toHaveBeenCalled();
			});

			rerender({ id: '2' });
			expect(getMsgSpy).toHaveBeenCalledTimes(2);
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
			renderHook(() => useCompleteMessageOrFetch('1'));
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
			await waitFor(() => {
				updateMessageStatus(message.id, API_REQUEST_STATUS.pending);
			});
			const response: GetMsgResponse = {
				m: [generateCompleteMessageFromAPI({ id: '1' })]
			};

			createSoapAPIInterceptor<GetMsgRequest, GetMsgResponse>('GetMsg', response);

			const { result } = renderHook(() => useMessageStatus('1'));
			renderHook(() => useCompleteMessageOrFetch('1'));
			await waitFor(() => {
				expect(result.current).toBe(API_REQUEST_STATUS.pending);
			});
		});
	});

	function generateEmailsStoreState(
		conversations: Record<string, NormalizedConversation>
	): EmailsStoreState {
		return {
			messageIndexSlice: MESSAGE_INDEX_SLICE_INITIAL_STATE,
			searchIndexSlice: SEARCH_INDEX_SLICE_INITIAL_STATE,
			conversationIndexSlice: CONVERSATION_INDEX_SLICE_INITIAL_STATE,
			populatedItemsSlice: {
				conversations,
				messages: {},
				messagesStatus: {},
				conversationsStatus: {}
			}
		};
	}

	describe('deleteMessagesFromConversation', () => {
		describe('When called with valid message IDs', () => {
			it('should delete the specified messages from the conversation', () => {
				const messages = [{ id: '1' }, { id: '2' }] as Array<ConvMessage>;
				const conversation = { ...generateConversation({ id: '123' }), messages };
				const state = generateEmailsStoreState({ [conversation.id]: conversation });
				deleteMessagesFromConversation(['1', '2'], state);
				expect(state.populatedItemsSlice.conversations['123'].messages).toHaveLength(0);
			});

			it('should not affect other messages in the conversation', () => {
				const messages = [{ id: '1' }, { id: '2' }, { id: '3' }] as Array<ConvMessage>;
				const conversation = { ...generateConversation({ id: '123' }), messages };
				const state = generateEmailsStoreState({ [conversation.id]: conversation });
				deleteMessagesFromConversation(['1', '2'], state);
				expect(state.populatedItemsSlice.conversations['123'].messages).toHaveLength(1);
			});
		});

		describe('When called with an empty array of IDs', () => {
			it('should not modify any messages in the conversations', () => {
				const messages = [{ id: '1' }, { id: '2' }, { id: '3' }] as Array<ConvMessage>;
				const conversation = { ...generateConversation({ id: '123' }), messages };
				const state = generateEmailsStoreState({ [conversation.id]: conversation });
				deleteMessagesFromConversation([], state);
				expect(state.populatedItemsSlice.conversations['123'].messages).toHaveLength(3);
			});
		});

		describe('When called with non-existent message IDs', () => {
			it('should not delete any messages from the conversations', () => {
				const messages = [{ id: '1' }, { id: '2' }, { id: '3' }] as Array<ConvMessage>;
				const conversation = { ...generateConversation({ id: '123' }), messages };
				const state = generateEmailsStoreState({ [conversation.id]: conversation });
				deleteMessagesFromConversation(['4', '5'], state);
				expect(state.populatedItemsSlice.conversations['123'].messages).toHaveLength(3);
			});
		});

		describe('When conversations have no messages', () => {
			it('should leave the state unchanged', () => {
				const messages = [] as Array<ConvMessage>;
				const conversation = { ...generateConversation({ id: '123' }), messages };
				const state = generateEmailsStoreState({ [conversation.id]: conversation });
				deleteMessagesFromConversation(['1', '2'], state);
				expect(state.populatedItemsSlice.conversations['123']).toMatchObject(
					expect.objectContaining({ id: '123', messages: [] })
				);
			});
		});

		describe('When the conversations array is empty', () => {
			it('should leave the state unchanged', () => {
				const state = generateEmailsStoreState({});
				const expectedState = cloneDeep(state);
				deleteMessagesFromConversation(['1', '2'], state);
				expect(state).toMatchObject(expectedState);
			});
		});

		describe('Performance and scalability', () => {
			it('should handle a large number of conversations efficiently', () => {
				const numberOfConversations = 1000;
				const conversaiontIds = Array.from({ length: numberOfConversations }, (_, index) =>
					index.toString()
				);
				const conversations = reduce(
					conversaiontIds,
					(acc, id) => ({
						...acc,
						[id.toString()]: generateConversation({ id, messages: [{ id: '1' } as ConvMessage] })
					}),
					{} as PopulatedItemsSliceState['populatedItemsSlice']['conversations']
				);
				const state = generateEmailsStoreState(conversations);
				const start = performance.now();
				deleteMessagesFromConversation(['1', '2'], state);
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
				const conversations = reduce(
					conversaiontIds,
					(acc, id) => ({
						...acc,
						[id.toString()]: generateConversation({ id, messages: messages as Array<ConvMessage> })
					}),
					{} as PopulatedItemsSliceState['populatedItemsSlice']['conversations']
				);
				const state = generateEmailsStoreState(conversations);
				const start = performance.now();
				deleteMessagesFromConversation(['1'], state);
				const end = performance.now();
				expect(end - start).toBeLessThan(10);
			});
		});
	});
});
