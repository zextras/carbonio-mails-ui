/* eslint-disable @typescript-eslint/no-use-before-define */
/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { AsyncThunkAction, EnhancedStore } from '@reduxjs/toolkit';
import { SoapFault } from '@zextras/carbonio-shell-ui/lib/types/network/soap';

import { createSoapAPIInterceptor } from '../../../carbonio-ui-commons/test/mocks/network/msw/create-api-interceptor';
import { generateStore } from '../../../tests/generators/store';
import {
	ConvMessage,
	Conversation,
	FetchConversationsParameters,
	FetchConversationsReturn,
	MailsStateType,
	MsgMapValue,
	SearchRequest,
	SearchResponse,
	SoapConversation,
	SoapIncompleteMessage,
	SoapMailMessage,
	SoapMailMessagePart,
	SoapMailParticipant
} from '../../../types';
import { search } from '../search';

describe('search', () => {
	let store: EnhancedStore<MailsStateType>;

	beforeEach(() => {
		store = generateStore();
	});

	test('should call the searchAPI with the correct query', async () => {
		const interceptor = createSoapAPIInterceptor<SearchRequest>('Search');

		await storeDispatch(search({ query: 'find-me', limit: 100 }));

		expect((await interceptor).query).toBe('find-me');
		expect(store.getState().searches.query).toBe('find-me');
	});

	test('should populate the store when the search returns a conversation successfully', async () => {
		createSoapAPIInterceptor<SearchRequest, SearchResponse>('Search', {
			c: [conversationFromAPI({ id: '123', su: 'Subject' })],
			more: false
		});

		await storeDispatch(search({ query: 'any', limit: 100 }));

		expect(store.getState().searches.conversations).toEqual({
			'123': conversationFromStore({ id: '123', subject: 'Subject' })
		});
	});

	test('should populate the store with the conversation messages', async () => {
		createSoapAPIInterceptor<SearchRequest, SearchResponse>('Search', {
			c: [conversationFromAPI({ id: '123', m: [convMessageFromAPI({ id: '987', l: 'folder2' })] })],
			more: false
		});

		await storeDispatch(search({ query: 'any', limit: 100 }));

		expect(store.getState().searches.conversations?.['123'].messages).toEqual([
			convMessageFromStore({ id: '987', parent: 'folder2' })
		]);
	});

	test('should populate the store when the search returns a message successfully', async () => {
		createSoapAPIInterceptor<SearchRequest, SearchResponse>('Search', {
			m: [messageFromAPI({ id: '456', su: 'Subject' })],
			more: false
		});
		await storeDispatch(search({ query: 'any', limit: 100, types: 'message' }));

		expect(store.getState().searches.messages).toEqual({
			'456': messageFromStore({ id: '456', subject: 'Subject' })
		});
	});

	test('should pollute the conversation stores', async () => {
		createSoapAPIInterceptor<SearchRequest, SearchResponse>('Search', {
			c: [conversationFromAPI({ id: '123' })],
			more: false
		});

		await storeDispatch(search({ query: 'any', limit: 100 }));

		expect(store.getState().conversations.conversations).toEqual({
			'123': conversationFromStore({ id: '123', subject: 'Subject' })
		});
	});

	test('should not pollute the message stores', async () => {
		createSoapAPIInterceptor<SearchRequest, SearchResponse>('Search', {
			m: [messageFromAPI({ id: '123' })],
			more: false
		});

		await storeDispatch(search({ query: 'any', limit: 100 }));

		expect(store.getState().conversations.conversations).toEqual({});
		expect(store.getState().messages.messages).toEqual({});
	});

	test('should populate the searchResultsIds when a conversation is retrieved including also its child messages', async () => {
		createSoapAPIInterceptor<SearchRequest, SearchResponse>('Search', {
			c: [conversationFromAPI({ id: '123' })],
			more: false
		});

		await storeDispatch(search({ query: 'any', limit: 100 }));

		expect(store.getState().searches.searchResultsIds).toEqual(['123', '987']);
	});

	test('should populate the searchResultsIds when a message is retrieved', async () => {
		createSoapAPIInterceptor<SearchRequest, SearchResponse>('Search', {
			m: [messageFromAPI({ id: '456' })],
			more: false
		});

		await storeDispatch(search({ query: 'any', limit: 100, types: 'message' }));

		expect(store.getState().searches.searchResultsIds).toEqual(['456']);
	});

	test('if request type is missing, only conversations are set in the store', async () => {
		createSoapAPIInterceptor<SearchRequest, SearchResponse>('Search', {
			c: [conversationFromAPI({ id: '123', su: 'Subject1' })],
			m: [messageFromAPI({ id: '456', cid: '456' })],
			more: false
		});

		await storeDispatch(search({ query: 'aaaaaa', limit: 100 }));

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
			search({
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
			search({
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

		await storeDispatch(search({ query: 'aaaaaa', limit: 100 }));

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
		m: [convMessageFromAPI()],
		e: [],
		su: 'Subject',
		fr: 'fragment',
		...params
	};
}

function convMessageFromAPI(params: Partial<SoapMailMessage> = {}): SoapMailMessage {
	return {
		...messageFromAPI({ id: '987', d: 987 }),
		su: 'Subject',
		fr: 'Fragment',
		e: [fromParticipantFromAPI({ a: 'from@loc.al' }), toParticipantFromAPI({ a: 'to@loc.al' })],
		mp: [messagePartFromAPI()],
		...params
	};
}

function fromParticipantFromAPI(params: Partial<SoapMailParticipant> = {}): SoapMailParticipant {
	return {
		a: 'add@re.ss',
		p: 'p',
		t: 'f',
		...params
	};
}

function toParticipantFromAPI(params: Partial<SoapMailParticipant> = {}): SoapMailParticipant {
	return {
		a: 'add@re.ss',
		p: 'p',
		t: 't',
		...params
	};
}

function messagePartFromAPI(params: Partial<SoapMailMessagePart> = {}): SoapMailMessagePart {
	return {
		part: 'part',
		ct: 'ct',
		requiresSmartLinkConversion: false,
		...params
	};
}

function messageFromAPI(params: Partial<SoapIncompleteMessage> = {}): SoapIncompleteMessage {
	return {
		id: '456',
		cid: '456',
		l: 'folder1',
		s: 123,
		d: 456,
		...params
	};
}

/* FIXME:
 * We had to use Partial<Conversation> as return statement
 * because the type wants to have a parent attribute which is never set as we could see
 */
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
		messages: [convMessageFromStore()],
		sortIndex: 0,
		...params
	};
}

function convMessageFromStore(params: Partial<ConvMessage> = {}): ConvMessage {
	return {
		date: 987,
		id: '987',
		parent: 'folder1',
		...params
	};
}

function messageFromStore(params: Partial<MsgMapValue> = {}): MsgMapValue {
	return {
		conversation: '456',
		id: '456',
		date: 456,
		size: 123,
		parent: 'folder1',
		tags: [],
		isComplete: false,
		isScheduled: false,
		read: true,
		isReadReceiptRequested: true,
		sortIndex: 0,
		...params
	};
}
