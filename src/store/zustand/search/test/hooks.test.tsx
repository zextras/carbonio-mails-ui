/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { renderHook } from '@testing-library/react-hooks';
import produce from 'immer';

import { createSoapAPIInterceptor } from '../../../../carbonio-ui-commons/test/mocks/network/msw/create-api-interceptor';
import { API_REQUEST_STATUS } from '../../../../constants';
import { generateConvMessageFromAPI } from '../../../../helpers/api';
import { generateConversation } from '../../../../tests/generators/generateConversation';
import { generateMessage } from '../../../../tests/generators/generateMessage';
import { SearchConvRequest, SearchConvResponse, SoapConversation } from '../../../../types';
import { useConversationById, useMessageStore } from '../../message-store/store';
import {
	handleSearchResults,
	updateConversationStatus,
	useCompleteConversation,
	useConversationStatus
} from '../hooks/hooks';

function conversationFromAPI(params: Partial<SoapConversation> = {}): SoapConversation {
	return {
		id: '123',
		n: 1,
		u: 1,
		f: 'flag',
		tn: 'tag names',
		d: 123,
		m: [],
		e: [],
		su: 'Subject',
		fr: 'fragment',
		...params
	};
}
describe('Searches store hooks', () => {
	it('useConversationById should return a conversation', () => {
		const conversation = generateConversation({ id: '1', subject: 'Test conversation' });
		useMessageStore.setState(
			produce((state) => {
				state.search.conversationIds = new Set(['1']);
				state.populatedItems.conversations = { '1': conversation };
			})
		);

		const { result } = renderHook(() => useConversationById('1'));
		expect(result.current).toEqual(conversation);
	});

	it('handleSearchResults should update the store', () => {
		const searchResponse = {
			c: [conversationFromAPI({ id: '123', su: 'Subject' })],
			more: false
		};
		handleSearchResults({ searchResponse, offset: 0 });
		expect(useMessageStore.getState().populatedItems.conversations['123']).toBeDefined();
	});

	it('useCompleteConversation should update conversation status if conversation status is undefined', async () => {
		useMessageStore.setState(
			produce((state) => {
				state.search.conversationIds = new Set(['123']);
				const message1 = generateMessage({ id: '1', subject: 'Test Message 1' });

				const conversation = generateConversation({
					id: '123',
					messages: [message1],
					subject: 'Test Conversation'
				});
				state.populatedItems.conversations = { '123': conversation };
				state.populatedItems.conversationsStatus = {};
				state.populatedItems.messages = { '1': message1 };
			})
		);

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

	it('useCompleteConversation should not update conversation status if conversation status is already defined', async () => {
		useMessageStore.setState(
			produce((state) => {
				state.search.conversationIds = new Set(['123']);
				const message1 = generateMessage({ id: '1', subject: 'Test Message 1' });
				const conversation = generateConversation({
					id: '123',
					messages: [message1],
					subject: 'Test Conversation'
				});
				state.populatedItems.conversations = { '123': conversation };
				state.populatedItems.conversationsStatus = { '123': API_REQUEST_STATUS.pending };
				state.populatedItems.messages = { '1': message1 };
			})
		);
		const response: SearchConvResponse = {
			m: [generateConvMessageFromAPI({ id: '10' }), generateConvMessageFromAPI({ id: '2' })],
			more: false,
			offset: '',
			orderBy: ''
		};
		// TODO: make a wat to check API not called
		createSoapAPIInterceptor<SearchConvRequest, SearchConvResponse>('SearchConv', response);

		const { result, waitFor } = renderHook(() => useConversationStatus('123'));
		renderHook(() => useCompleteConversation('123', '2'));
		await waitFor(() => {
			expect(result.current).toBe(API_REQUEST_STATUS.pending);
		});
	});

	describe('updateConversationStatus', () => {
		it('should set conversation status in the store', () => {
			renderHook(() => updateConversationStatus('123', API_REQUEST_STATUS.pending));

			const conversationsStatus =
				useMessageStore.getState().populatedItems.conversationsStatus['123'];
			expect(conversationsStatus).toBe(API_REQUEST_STATUS.pending);
		});
	});

	describe('useConversationStatus', () => {
		it('should get undefined if conversation loading status not present', () => {
			const { result } = renderHook(() => useConversationStatus('123'));

			expect(result.current).toBeUndefined();
		});

		it('should get conversation status if value present', () => {
			useMessageStore.setState(
				produce((state) => {
					state.populatedItems.conversationsStatus = {
						'123': API_REQUEST_STATUS.fulfilled
					};
				})
			);

			const { result } = renderHook(() => useConversationStatus('123'));

			expect(result.current).toBe(API_REQUEST_STATUS.fulfilled);
		});
	});
});