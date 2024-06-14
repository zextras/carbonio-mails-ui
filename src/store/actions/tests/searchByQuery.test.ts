/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createSoapAPIInterceptor } from '../../../carbonio-ui-commons/test/mocks/network/msw/create-api-interceptor';
import { generateStore } from '../../../tests/generators/store';
import { FetchConversationsParameters, SearchRequest, SearchResponse } from '../../../types';
import { searchByQuery } from '../searchByQuery';

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
