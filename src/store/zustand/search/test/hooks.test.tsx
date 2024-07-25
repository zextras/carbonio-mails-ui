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
	updateConversations,
	updateConversationStatus,
	useConversationById,
	useConversationStatus
} from '../../message-store/store';
import { handleSearchResults, useCompleteConversation } from '../hooks/hooks';

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
	it('handleSearchResults should update the store', () => {
		const searchResponse = {
			c: [conversationFromAPI({ id: '123', su: 'Subject' })],
			more: false
		};

		handleSearchResults({ searchResponse, offset: 0 });

		expect(renderHook(() => useConversationById('123')).result.current).toBeDefined();
	});

	it('useCompleteConversation should return undefined conversation and status if no data available', async () => {
		const { result } = renderHook(() => useCompleteConversation('123', '2'));

		expect(result.current.conversation).toBeUndefined();
		expect(result.current.conversationStatus).toBeUndefined();
	});

	it('useCompleteConversation should update conversation status if conversation status is undefined', async () => {
		const conversation = generateConversation({
			id: '123',
			messages: [generateMessage({ id: '1', subject: 'Test Message 1' })],
			subject: 'Test Conversation'
		});
		updateConversations([conversation], 0);

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
		const conversation = generateConversation({
			id: '123',
			messages: [generateMessage({ id: '1', subject: 'Test Message 1' })],
			subject: 'Test Conversation'
		});
		updateConversations([conversation], 0);
		updateConversationStatus(conversation.id, API_REQUEST_STATUS.pending);
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
});
