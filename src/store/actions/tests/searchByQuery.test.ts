/* eslint-disable @typescript-eslint/no-use-before-define */
/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { AsyncThunkAction, EnhancedStore } from '@reduxjs/toolkit';
import { SoapFault } from '@zextras/carbonio-shell-ui';

import { createSoapAPIInterceptor } from '../../../carbonio-ui-commons/test/mocks/network/msw/create-api-interceptor';
import { generateStore } from '../../../tests/generators/store';
import {
	Conversation,
	FetchConversationsParameters,
	FetchConversationsReturn,
	MailsStateType,
	MsgMapValue,
	SearchRequest,
	SearchResponse,
	SoapConversation,
	SoapIncompleteMessage
} from '../../../types';
import { searchByQuery } from '../searchByQuery';

describe('searchByQuery', () => {
	let store: EnhancedStore<MailsStateType>;

	beforeEach(() => {
		store = generateStore();
	});

	test('should call the searchAPI with the correct query', async () => {
		const interceptor = createSoapAPIInterceptor<SearchRequest>('Search');

		await storeDispatch(searchByQuery({ query: 'find-me', limit: 100 }));

		expect((await interceptor).query).toBe('find-me');
		expect(store.getState().searches.query).toBe('find-me');
	});

	test('should populate the store when the searchByQuery returns a conversation successfully', async () => {
		createSoapAPIInterceptor<SearchRequest, SearchResponse>('Search', {
			c: [conversationFromAPI({ id: '123', su: 'Subject' })],
			more: false
		});

		await storeDispatch(searchByQuery({ query: 'any', limit: 100 }));

		expect(store.getState().searches.conversations).toEqual({
			'123': conversationFromStore({ id: '123', subject: 'Subject' })
		});
	});

	test('should populate the store when the searchByQuery returns a message successfully', async () => {
		createSoapAPIInterceptor<SearchRequest, SearchResponse>('Search', {
			m: [messageFromAPI({ id: '456', su: 'Subject' })],
			more: false
		});
		await storeDispatch(searchByQuery({ query: 'any', limit: 100, types: 'message' }));

		expect(store.getState().searches.messages).toEqual({
			'456': messageFromStore({ id: '456', subject: 'Subject' })
		});
	});

	test('should not pollute the conversation stores', async () => {
		createSoapAPIInterceptor<SearchRequest, SearchResponse>('Search', {
			c: [conversationFromAPI({ id: '123' })],
			more: false
		});

		await storeDispatch(searchByQuery({ query: 'any', limit: 100 }));

		expect(store.getState().conversations.conversations).toEqual({});
		expect(store.getState().messages.messages).toEqual({});
	});

	test('should not pollute the message stores', async () => {
		createSoapAPIInterceptor<SearchRequest, SearchResponse>('Search', {
			m: [messageFromAPI({ id: '123' })],
			more: false
		});

		await storeDispatch(searchByQuery({ query: 'any', limit: 100 }));

		expect(store.getState().conversations.conversations).toEqual({});
		expect(store.getState().messages.messages).toEqual({});
	});

	test('should populate the searchResultsIds when a conversation is retrieved', async () => {
		createSoapAPIInterceptor<SearchRequest, SearchResponse>('Search', {
			c: [conversationFromAPI({ id: '123' })],
			more: false
		});

		await storeDispatch(searchByQuery({ query: 'any', limit: 100 }));

		expect(store.getState().searches.searchResultsIds).toEqual(['123']);
	});

	test('should populate the searchResultsIds when a message is retrieved', async () => {
		createSoapAPIInterceptor<SearchRequest, SearchResponse>('Search', {
			m: [messageFromAPI({ id: '456' })],
			more: false
		});

		await storeDispatch(searchByQuery({ query: 'any', limit: 100, types: 'message' }));

		expect(store.getState().searches.searchResultsIds).toEqual(['456']);
	});

	test('if request type is missing, only conversations are set in the store', async () => {
		createSoapAPIInterceptor<SearchRequest, SearchResponse>('Search', {
			c: [conversationFromAPI({ id: '123', su: 'Subject1' })],
			m: [messageFromAPI({ id: '456', cid: '456' })],
			more: false
		});

		await storeDispatch(searchByQuery({ query: 'aaaaaa', limit: 100 }));

		expect(store.getState().searches.conversations?.['123']).toBeDefined();
		expect(store.getState().searches.messages).toStrictEqual({});
	});

	test('if request type is conversation, only conversations are set in the store', async () => {
		createSoapAPIInterceptor<SearchRequest, SearchResponse>('Search', {
			c: [conversationFromAPI({ id: '123', su: 'Subject1' })],
			m: [messageFromAPI({ id: '456', cid: '456' })],
			more: false
		});

		await storeDispatch(
			searchByQuery({
				query: 'aaaaaa',
				limit: 100,
				types: 'conversation'
			})
		);

		expect(store.getState().searches.conversations?.['123']).toBeDefined();
		expect(store.getState().searches.messages).toStrictEqual({});
	});

	test('if request type is message, messages are set in the searches store', async () => {
		createSoapAPIInterceptor<SearchRequest, SearchResponse>('Search', {
			c: [conversationFromAPI({ id: '123', su: 'Subject1' })],
			m: [messageFromAPI({ id: '456', cid: '456' })],
			more: false
		});

		await storeDispatch(
			searchByQuery({
				query: 'aaaaaa',
				limit: 100,
				types: 'message'
			})
		);

		expect(store.getState().searches.messages['456']).toBeDefined();
		expect(store.getState().searches.conversations).toStrictEqual({});
	});

	test('if soap response fails store is unaltered', async () => {
		createSoapAPIInterceptor<SearchRequest, SoapFault>('Search', failFromAPI());

		await storeDispatch(searchByQuery({ query: 'aaaaaa', limit: 100 }));

		expect(store.getState().searches.messages).toStrictEqual({});
		expect(store.getState().searches.conversations).toStrictEqual({});
	});

	async function storeDispatch(
		action: AsyncThunkAction<
			FetchConversationsReturn | undefined,
			FetchConversationsParameters,
			any
		>
	): Promise<void> {
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		await store.dispatch(action);
	}
});

function failFromAPI(): SoapFault {
	return {
		Detail: {
			Error: {
				Code: 'ERROR',
				Detail: 'The server failed for an unknown reason'
			}
		},
		Reason: {
			Text: 'It just failed!'
		}
	};
}

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

function messageFromAPI(params: Partial<SoapIncompleteMessage> = {}): SoapIncompleteMessage {
	return {
		id: '456',
		cid: '456',
		l: '1',
		s: 123,
		d: 456,
		...params
	};
}

function conversationFromStore(params: Partial<Conversation> = {}): Partial<Conversation> {
	return {
		tags: ['nil:tag names'],
		id: '123',
		date: 123,
		participants: [],
		subject: 'Subject',
		fragment: 'fragment',
		read: true,
		hasAttachment: true,
		flagged: true,
		urgent: false,
		messagesInConversation: 1,
		sortIndex: 0,
		...params
	};
}

function messageFromStore(params: Partial<MsgMapValue>): MsgMapValue {
	return {
		conversation: '456',
		id: '456',
		date: 456,
		size: 123,
		parent: '1',
		tags: [],
		isComplete: false,
		isScheduled: false,
		read: true,
		isReadReceiptRequested: true,
		sortIndex: 0,
		...params
	};
}
