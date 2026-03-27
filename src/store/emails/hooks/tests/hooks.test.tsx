/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/* eslint-disable sonarjs/no-duplicate-string */
/* eslint-disable no-param-reassign */

import { act, renderHook, waitFor } from '@testing-library/react';
import { cloneDeep, map } from 'lodash';

import { createSoapAPIInterceptor } from '@test-utils/network/msw/create-api-interceptor';
import {
	generateCompleteMessageFromAPI,
	generateConvMessageFromAPI
} from '__test__/generators/api';
import { generateConversation } from '__test__/generators/generateConversation';
import { generateMessage } from '__test__/generators/generateMessage';
import * as getMsg from 'api/get-msg-soap-api';
import { API_REQUEST_STATUS, DEFAULT_API_DEBOUNCE_TIME } from 'constants/index';
import {
	useCompleteConversationOrFetch,
	useCompleteMessageOrFetch
} from 'store/emails/hooks/hooks';
import { CONVERSATION_INDEX_SLICE_INITIAL_STATE } from 'store/emails/slices/conversations/conversations-index-slice';
import { MESSAGE_INDEX_SLICE_INITIAL_STATE } from 'store/emails/slices/messages/messages-slice';
import { deleteMessagesFromConversation } from 'store/emails/slices/populated-items/utils';
import { SEARCH_INDEX_SLICE_INITIAL_STATE } from 'store/emails/slices/search/search-slice';
import {
	setMessagesInEmailStore,
	setSearchResultsByConversation,
	setSearchResultsByMessage,
	updateConversationStatus,
	updateMessageStatus,
	useConversationStatus,
	useMessageStatus
} from 'store/emails/store';
import { ConvMessage, NormalizedConversation } from 'types/conversations';
import { MailMessage } from 'types/messages';
import { EmailsStoreState } from 'types/search';
import { GetMsgRequest, GetMsgResponse } from 'types/soap/get-msg';
import { SearchConvRequest, SearchConvResponse } from 'types/soap/search-conv';

function awaitDebounce(): void {
	act(() => {
		vi.advanceTimersByTime(DEFAULT_API_DEBOUNCE_TIME);
	});
}

describe('Searches store hooks', () => {
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

			const { result } = renderHook(() =>
				useCompleteConversationOrFetch({ conversationId: '123', folderId: '2' })
			);

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
			renderHook(() => useCompleteConversationOrFetch({ conversationId: '123', folderId: '2' }));
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
			renderHook(() => useCompleteConversationOrFetch({ conversationId: '123', folderId: '2' }));
			await waitFor(() => {
				expect(result.current).toBe(API_REQUEST_STATUS.pending);
			});
		});
	});

	describe('useCompleteMessageOrFetch', () => {
		it('should fetch if message is not in the store', async () => {
			const response: GetMsgResponse = {
				m: [generateCompleteMessageFromAPI({ id: '1' })]
			};

			const interceptor = createSoapAPIInterceptor<GetMsgRequest, GetMsgResponse>(
				'GetMsg',
				response
			);

			renderHook(() => useCompleteMessageOrFetch({ messageId: '1' }));

			act(() => {
				vi.advanceTimersByTime(DEFAULT_API_DEBOUNCE_TIME);
			});

			const getMsgRequest = await interceptor;

			await act(async () => {
				expect(getMsgRequest).toMatchObject({ m: expect.objectContaining({ id: '1' }) });
			});
		});

		it('should fetch if the message is not complete', async () => {
			const message = generateMessage({ id: '1' });
			setMessagesInEmailStore([{ ...message, isComplete: false }], false);
			const getMsgSpy = vi.spyOn(getMsg, 'getMsgSoapApi');
			renderHook(() => useCompleteMessageOrFetch({ messageId: '1' }));

			awaitDebounce();

			await act(async () => {
				expect(getMsgSpy).toHaveBeenCalled();
			});
		});

		it('should not fetch if the message is complete and messageStatus is fulfilled', async () => {
			const message = generateMessage({ id: '1' });
			await act(async () => {
				setMessagesInEmailStore([{ ...message, isComplete: true }], false);
			});

			await act(async () => {
				updateMessageStatus(message.id, API_REQUEST_STATUS.fulfilled);
			});
			const getMsgSpy = vi.spyOn(getMsg, 'getMsgSoapApi');
			// eslint-disable-next-line testing-library/no-unnecessary-act
			await act(async () => {
				renderHook(() => useCompleteMessageOrFetch({ messageId: message.id }));
			});

			expect(getMsgSpy).not.toHaveBeenCalled();
		});

		it('should fetch if the messageStatus is undefined', async () => {
			const message = generateMessage({ id: '1' });
			await act(async () => {
				setMessagesInEmailStore([{ ...message, isComplete: true }], false);
			});

			await act(async () => {
				updateMessageStatus(message.id, undefined as never);
			});
			const getMsgSpy = vi.spyOn(getMsg, 'getMsgSoapApi');

			// eslint-disable-next-line testing-library/no-unnecessary-act
			await act(async () => {
				renderHook(() => useCompleteMessageOrFetch({ messageId: message.id }));
			});

			awaitDebounce();

			await waitFor(async () => {
				expect(getMsgSpy).toHaveBeenCalledTimes(1);
			});
		});

		it('should fetch if the message is incomplete and status is error', async () => {
			const message = generateMessage({ id: '1' });
			setMessagesInEmailStore([{ ...message, isComplete: false }], false);
			updateMessageStatus('1', API_REQUEST_STATUS.error);
			const getMsgSpy = vi.spyOn(getMsg, 'getMsgSoapApi');
			renderHook(() => useCompleteMessageOrFetch({ messageId: '1' }));

			awaitDebounce();

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
			const getMsgSpy = vi.spyOn(getMsg, 'getMsgSoapApi');
			renderHook(() => useCompleteMessageOrFetch({ messageId: '1' }));

			await act(async () => {
				expect(getMsgSpy).not.toHaveBeenCalled();
			});
		});

		it('should fetch a new message if messageId changes', async () => {
			const getMsgSpy = vi.spyOn(getMsg, 'getMsgSoapApi');
			const { rerender } = renderHook(({ id }) => useCompleteMessageOrFetch({ messageId: id }), {
				initialProps: { id: '1' }
			});

			awaitDebounce();

			await act(async () => {
				expect(getMsgSpy).toHaveBeenCalledTimes(1);
			});

			await waitFor(async () => {
				// eslint-disable-next-line testing-library/no-wait-for-side-effects
				rerender({ id: '2' });
			});

			awaitDebounce();

			await act(async () => {
				expect(getMsgSpy).toHaveBeenCalledTimes(2);
			});
		});

		it('should update status if initial status is undefined', async () => {
			const message = generateMessage({
				id: '1',
				subject: 'Test Message'
			});
			setSearchResultsByMessage([message], false);
			await act(async () => {
				updateMessageStatus(message.id, undefined as never);
			});

			const response: GetMsgResponse = {
				m: [generateCompleteMessageFromAPI({ id: message.id })]
			};

			createSoapAPIInterceptor<GetMsgRequest, GetMsgResponse>('GetMsg', response);

			const { result } = renderHook(() => useMessageStatus(message.id));
			renderHook(() => useCompleteMessageOrFetch({ messageId: message.id }));

			await waitFor(() => {
				expect(result.current).toBe(API_REQUEST_STATUS.fulfilled);
			});
		});
	});

	function arrayToRecord<T extends { id: string }>(items: Array<T> | undefined): Record<string, T> {
		if (!items) return {};
		return items.reduce(
			(acc, item) => {
				acc[item.id as string] = item;
				return acc;
			},
			{} as Record<string, T>
		);
	}

	function generateEmailsStoreState(
		conversations: Array<NormalizedConversation>,
		messages?: Array<MailMessage>
	): EmailsStoreState {
		return {
			messageIndexSlice: MESSAGE_INDEX_SLICE_INITIAL_STATE,
			searchIndexSlice: SEARCH_INDEX_SLICE_INITIAL_STATE,
			conversationIndexSlice: CONVERSATION_INDEX_SLICE_INITIAL_STATE,
			populatedItemsSlice: {
				conversations: arrayToRecord(conversations),
				messages: arrayToRecord(messages),
				messagesStatus: {},
				conversationsStatus: {}
			}
		};
	}
	describe('deleteMessagesFromConversation', () => {
		describe('When called with valid message IDs', () => {
			it('should delete the specified messages from the conversation', () => {
				const messages = [generateMessage({ id: '1' }), generateMessage({ id: '2' })];
				const conversation = { ...generateConversation({ id: '123' }), messageIds: ['1', '2'] };
				const state = generateEmailsStoreState([conversation], messages);
				deleteMessagesFromConversation(['1', '2'], state);
				expect(state.populatedItemsSlice.conversations['123'].messageIds).toHaveLength(0);
			});

			it('should not affect other messages in the conversation', () => {
				const messages = [
					generateMessage({ id: '1' }),
					generateMessage({ id: '2' }),
					generateMessage({ id: '3' })
				];
				const conversation = {
					...generateConversation({ id: '123' }),
					messageIds: messages.map((m) => m.id)
				};
				const state = generateEmailsStoreState([conversation], messages);
				deleteMessagesFromConversation(['1', '2'], state);
				expect(state.populatedItemsSlice.conversations['123'].messageIds).toHaveLength(1);
			});
		});

		describe('When called with an empty array of IDs', () => {
			it('should not modify any messages in the conversations', () => {
				const messages = [
					generateMessage({ id: '1' }),
					generateMessage({ id: '2' }),
					generateMessage({ id: '3' })
				];
				const conversation = {
					...generateConversation({ id: '123' }),
					messageIds: ['1', '2', '3']
				};
				const state = generateEmailsStoreState([conversation], messages);
				deleteMessagesFromConversation([], state);
				expect(state.populatedItemsSlice.conversations['123'].messageIds).toHaveLength(3);
			});
		});

		describe('When called with non-existent message IDs', () => {
			it('should not delete any messages from the conversations', () => {
				const messages = [
					generateMessage({ id: '1' }),
					generateMessage({ id: '2' }),
					generateMessage({ id: '3' })
				];
				const conversation = {
					...generateConversation({ id: '123' }),
					messageIds: messages.map((m) => m.id)
				};
				const state = generateEmailsStoreState([conversation], messages);
				deleteMessagesFromConversation(['4', '5'], state);
				expect(state.populatedItemsSlice.conversations['123'].messageIds).toHaveLength(3);
			});
		});

		describe('When conversations have no messages', () => {
			it('should leave the state unchanged', () => {
				const messages = [] as Array<ConvMessage>;
				const conversation = { ...generateConversation({ id: '123' }), messages };
				const state = generateEmailsStoreState([conversation]);
				deleteMessagesFromConversation(['1', '2'], state);
				expect(state.populatedItemsSlice.conversations['123']).toMatchObject(
					expect.objectContaining({ id: '123', messages: [] })
				);
			});
		});

		describe('When the conversations array is empty', () => {
			it('should leave the state unchanged', () => {
				const state = generateEmailsStoreState([]);
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

				const conversations = conversaiontIds.map((id) => generateConversation({ id }));
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
				const messages = map(messageIds, (id) => generateMessage({ id }));
				const conversations = conversaiontIds.map((id) => generateConversation({ id }));

				const state = generateEmailsStoreState(conversations, messages);
				const start = performance.now();
				deleteMessagesFromConversation(['1'], state);
				const end = performance.now();
				expect(end - start).toBeLessThan(10);
			});
		});
	});
});
