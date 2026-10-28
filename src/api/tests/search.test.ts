/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createSoapAPIInterceptor } from '@test-utils/network/msw/create-api-interceptor';
import { searchSoapApi } from 'api/search-soap-api';
import { SearchRequest } from 'types/soap/search';

describe('Search', () => {
	it('should not send the options that Search reads only with fetch', async () => {
		const interceptor = createSoapAPIInterceptor<SearchRequest>('Search');

		searchSoapApi({
			query: 'aaa',
			limit: 10,
			sortBy: 'dateDesc'
		});

		const receivedRequest = await interceptor;
		expect(receivedRequest).not.toHaveProperty('needExp');
		expect(receivedRequest).not.toHaveProperty('wantContent');
		expect(receivedRequest.recip).toBe('2');
		expect(receivedRequest.fullConversation).toBe(1);
	});

	it('should send the locale when given', async () => {
		const interceptor = createSoapAPIInterceptor<SearchRequest>('Search');

		searchSoapApi({
			query: 'aaa',
			limit: 10,
			sortBy: 'dateDesc',
			locale: 'it'
		});

		const receivedRequest = await interceptor;
		expect(receivedRequest.locale).toEqual({ _content: 'it' });
	});

	it('should send dateDesc filter if readDesc', async () => {
		const interceptor = createSoapAPIInterceptor<SearchRequest>('Search');

		searchSoapApi({
			query: 'aaa',
			limit: 10,
			sortBy: 'readDesc'
		});

		const receivedRequest = await interceptor;
		expect(receivedRequest.sortBy).toBe('dateDesc');
	});

	it('should send dateAsc filter if readAsc', async () => {
		const interceptor = createSoapAPIInterceptor<SearchRequest>('Search');

		searchSoapApi({
			query: 'aaa',
			limit: 10,
			sortBy: 'readAsc'
		});

		const receivedRequest = await interceptor;
		expect(receivedRequest.sortBy).toBe('dateAsc');
	});

	it('should send the query as given', async () => {
		const interceptor = createSoapAPIInterceptor<SearchRequest>('Search');

		searchSoapApi({
			query: 'whatever',
			limit: 10,
			sortBy: 'flagAsc'
		});

		const receivedRequest = await interceptor;
		expect(receivedRequest.query).toBe('whatever');
		expect(receivedRequest.sortBy).toBe('flagAsc');
	});

	it('should send sizeAsc if attachAsc', async () => {
		const interceptor = createSoapAPIInterceptor<SearchRequest>('Search');

		searchSoapApi({
			query: 'aaa',
			limit: 10,
			sortBy: 'attachAsc'
		});

		const receivedRequest = await interceptor;
		expect(receivedRequest.sortBy).toBe('sizeAsc');
	});

	it('should send sizeDesc if attachDesc', async () => {
		const interceptor = createSoapAPIInterceptor<SearchRequest>('Search');

		searchSoapApi({
			query: 'aaa',
			limit: 10,
			sortBy: 'attachDesc'
		});

		const receivedRequest = await interceptor;
		expect(receivedRequest.sortBy).toBe('sizeDesc');
	});

	describe('sortBy changeDate', () => {
		it('should send changeDateAsc as-is when sortBy is changeDateAsc', async () => {
			const interceptor = createSoapAPIInterceptor<SearchRequest>('Search');

			searchSoapApi({
				query: 'aaa',
				limit: 10,
				sortBy: 'changeDateAsc'
			});

			const receivedRequest = await interceptor;
			expect(receivedRequest.sortBy).toBe('changeDateAsc');
		});

		it('should send changeDateDesc as-is when sortBy is changeDateDesc', async () => {
			const interceptor = createSoapAPIInterceptor<SearchRequest>('Search');

			searchSoapApi({
				query: 'aaa',
				limit: 10,
				sortBy: 'changeDateDesc'
			});

			const receivedRequest = await interceptor;
			expect(receivedRequest.sortBy).toBe('changeDateDesc');
		});
	});
});
