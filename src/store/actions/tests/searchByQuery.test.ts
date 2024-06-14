/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createSoapAPIInterceptor } from '../../../carbonio-ui-commons/test/mocks/network/msw/create-api-interceptor';
import { generateStore } from '../../../tests/generators/store';
import { FetchConversationsParameters, SearchRequest, SearchResponse } from '../../../types';
import { searchByQuery } from '../searchByQuery';

type FetchCase = {
	description: string;
	fetchParams: FetchConversationsParameters;
	soapResponse: SearchResponse;
	// expectedState type should be MailsStateType, but some filed in the state are missing
	expectedState: any;
};

describe('searchByQuery', () => {
	const queryParam: FetchConversationsParameters = {
		query: 'aaaaaa',
		limit: 100
	};
	const searchResponse: SearchResponse = {
		c: [
			{
				id: '123',
				n: 1,
				u: 1,
				f: 'flag',
				tn: 'tag names',
				d: 123,
				m: [],
				e: [],
				su: 'Subject',
				fr: 'fragment'
			}
		],
		more: false
	};
	test('should call the searchAPI with the correct query', async () => {
		const store = generateStore();
		const interceptor = createSoapAPIInterceptor<SearchRequest>('Search');

		const query = 'aaaaaa';
		await store
			.dispatch(
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				searchByQuery({ query })
			)
			.then(() => {
				expect(store.getState().searches.query).toBe(query);
			});
		const request = await interceptor;
		expect(request.query).toBe(query);
	});

	test('should populate the store when the searchByQuery is successfull', async () => {
		const store = generateStore();
		createSoapAPIInterceptor<SearchRequest, SearchResponse>('Search', searchResponse);

		await store
			.dispatch(
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				searchByQuery(queryParam)
			)
			.then(() => {
				expect(store.getState().searches.conversations).toEqual({
					'123': {
						date: 123,
						flagged: true,
						fragment: 'fragment',
						hasAttachment: true,
						id: '123',
						messagesInConversation: 1,
						participants: [],
						read: true,
						sortIndex: 0,
						subject: 'Subject',
						tags: ['nil:tag names'],
						urgent: false
					}
				});
			});
	});

	test('should not pollute the message and conversation stores', async () => {
		const store = generateStore();
		createSoapAPIInterceptor<SearchRequest, SearchResponse>('Search', searchResponse);

		await store
			.dispatch(
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				searchByQuery(queryParam)
			)
			.then(() => {
				expect(store.getState().conversations.conversations).toEqual({});
				expect(store.getState().messages.messages).toEqual({});
			});
	});
});

describe('searchByQuery check state - ', () => {
	const fetchCases: FetchCase[] = [
		{
			description: 'if request type is missing, only conversations are set in the store',
			fetchParams: {
				query: 'aaaaaa',
				limit: 100
			},
			soapResponse: {
				c: [
					{
						id: '123',
						n: 1,
						u: 1,
						f: 'flag',
						tn: 'tag names',
						d: 123,
						m: [],
						e: [],
						su: 'Subject',
						fr: 'fragment'
					}
				],
				m: [
					{
						id: '456',
						cid: '456',
						l: '1',
						s: 123,
						d: 456
					}
				],
				more: false
			},
			expectedState: {
				conversations: {
					currentFolder: '2',
					conversations: {},
					expandedStatus: {},
					searchedInFolder: {},
					searchRequestStatus: null
				},
				messages: {
					messages: {},
					searchRequestStatus: null
				},
				searches: {
					searchResults: undefined,
					searchResultsIds: ['123'],
					conversations: {
						123: {
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
							sortIndex: 0
						}
					},
					messages: {},
					more: false,
					offset: 0,
					limit: 100,
					sortBy: 'dateDesc',
					query: 'aaaaaa',
					status: 'fulfilled',
					loadingMessage: '',
					parent: '',
					error: undefined
				}
			}
		},
		{
			description: 'if request type is conversation, only conversations are set in the store',
			fetchParams: {
				query: 'aaaaaa',
				limit: 100,
				types: 'conversation'
			},
			soapResponse: {
				c: [
					{
						id: '123',
						n: 1,
						u: 1,
						f: 'flag',
						tn: 'tag names',
						d: 123,
						m: [],
						e: [],
						su: 'Subject',
						fr: 'fragment'
					}
				],
				m: [
					{
						id: '456',
						cid: '456',
						l: '1',
						s: 123,
						d: 456
					}
				],
				more: false
			},
			expectedState: {
				conversations: {
					currentFolder: '2',
					conversations: {},
					expandedStatus: {},
					searchedInFolder: {},
					searchRequestStatus: null
				},
				messages: {
					messages: {},
					searchRequestStatus: null
				},
				searches: {
					searchResults: undefined,
					searchResultsIds: ['123'],
					conversations: {
						123: {
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
							sortIndex: 0
						}
					},
					messages: {},
					more: false,
					offset: 0,
					limit: 100,
					sortBy: 'dateDesc',
					query: 'aaaaaa',
					status: 'fulfilled',
					loadingMessage: '',
					parent: '',
					error: undefined
				}
			}
		},
		{
			description: 'if request type is message, messages are set in the searches store',
			fetchParams: {
				query: 'aaaaaa',
				limit: 100,
				types: 'message'
			},
			soapResponse: {
				c: [
					{
						id: '123',
						n: 1,
						u: 1,
						f: 'flag',
						tn: 'tag names',
						d: 123,
						m: [],
						e: [],
						su: 'Subject',
						fr: 'fragment'
					}
				],
				m: [
					{
						id: '456',
						cid: '456',
						l: '1',
						s: 123,
						d: 456
					}
				],
				more: false
			},
			expectedState: {
				conversations: {
					currentFolder: '2',
					conversations: {},
					expandedStatus: {},
					searchedInFolder: {},
					searchRequestStatus: null
				},
				messages: {
					messages: {},
					searchRequestStatus: null
				},
				searches: {
					searchResults: undefined,
					searchResultsIds: ['456'],
					conversations: {},
					messages: {
						'456': {
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
							sortIndex: 0
						}
					},
					more: false,
					offset: 0,
					limit: 100,
					sortBy: 'dateDesc',
					query: 'aaaaaa',
					status: 'fulfilled',
					loadingMessage: '',
					parent: '',
					error: undefined
				}
			}
		}
	];

	test.each(fetchCases)(`$description`, async (fetchCase) => {
		const searchResponseWithConvAndMessages: SearchResponse = fetchCase.soapResponse;
		const store = generateStore();
		createSoapAPIInterceptor<SearchRequest, SearchResponse>(
			'Search',
			searchResponseWithConvAndMessages
		);

		await store
			.dispatch(
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				searchByQuery(fetchCase.fetchParams)
			)
			.then(() => {
				const newStoreState = store.getState();
				expect(newStoreState).toEqual(fetchCase.expectedState);
			});
	});
});
