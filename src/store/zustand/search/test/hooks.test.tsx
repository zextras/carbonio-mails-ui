/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { renderHook } from '@testing-library/react-hooks';

import { createSoapAPIInterceptor } from '../../../../carbonio-ui-commons/test/mocks/network/msw/create-api-interceptor';
import { API_REQUEST_STATUS } from '../../../../constants';
import { generateConvMessageFromAPI } from '../../../../helpers/api';
import { generateConversation } from '../../../../tests/generators/generateConversation';
import { generateMessage } from '../../../../tests/generators/generateMessage';
import { SearchConvRequest, SearchConvResponse, SoapConversation } from '../../../../types';
import {
	getConversationById,
	messageStoreActions,
	useConversationById,
	useConversationStatus,
	useMessageStore
} from '../../message-store/store';
import { handleSearchResults, useLoadConversation } from '../hooks/hooks';

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
		messageStoreActions.updateConversations([conversation], 0);
		const { result } = renderHook(() => useConversationById('1'));
		expect(result.current).toEqual(conversation);
	});

	it('handleSearchResults should update the store', () => {
		const searchResponse = {
			c: [conversationFromAPI({ id: '123', su: 'Subject' })],
			more: false
		};
		handleSearchResults({ searchResponse, offset: 0 });
		expect(getConversationById('123')).toBeDefined();
	});

	it('loadConversation should update conversation status if conversation status is undefined', async () => {
		const state = useMessageStore.getState();
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
		useMessageStore.setState(state);
		const response: SearchConvResponse = {
			m: [generateConvMessageFromAPI({ id: '10' }), generateConvMessageFromAPI({ id: '2' })],
			more: false,
			offset: '',
			orderBy: ''
		};
		createSoapAPIInterceptor<SearchConvRequest, SearchConvResponse>('SearchConv', response);

		const { result, waitFor } = renderHook(() => useConversationStatus('123'));
		renderHook(() => useLoadConversation('123', '2'));
		await waitFor(() => {
			expect(result.current).toBe(API_REQUEST_STATUS.fulfilled);
		});
	});

	it('loadConversation should not update conversation status if conversation status is already defined', async () => {
		const state = useMessageStore.getState();
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
		useMessageStore.setState(state);
		const response: SearchConvResponse = {
			m: [generateConvMessageFromAPI({ id: '10' }), generateConvMessageFromAPI({ id: '2' })],
			more: false,
			offset: '',
			orderBy: ''
		};
		// TODO: make a wat to check API not called
		createSoapAPIInterceptor<SearchConvRequest, SearchConvResponse>('SearchConv', response);

		const { result, waitFor } = renderHook(() => useConversationStatus('123'));
		renderHook(() => useLoadConversation('123', '2'));
		await waitFor(() => {
			expect(result.current).toBe(API_REQUEST_STATUS.pending);
		});
	});
});
