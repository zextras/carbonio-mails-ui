/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createSoapAPIInterceptor } from '../../carbonio-ui-commons/test/mocks/network/msw/create-api-interceptor';
import { SearchRequest } from '../../types';
import { searchSoapApi } from '../search';

describe('Search', () => {
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

	describe('sortBy flag', () => {
		it('should add is:flagged to query if sortBy flagAsc and folderId present', async () => {
			const interceptor = createSoapAPIInterceptor<SearchRequest>('Search');

			searchSoapApi({
				folderId: '1',
				limit: 10,
				sortBy: 'flagAsc'
			});

			const receivedRequest = await interceptor;
			expect(receivedRequest.query).toBe('inId:"1" is:flagged');
		});

		it('should add is:flagged to query if sortBy flagDesc and folderId present', async () => {
			const interceptor = createSoapAPIInterceptor<SearchRequest>('Search');

			searchSoapApi({
				folderId: '1',
				limit: 10,
				sortBy: 'flagDesc'
			});

			const receivedRequest = await interceptor;
			expect(receivedRequest.query).toBe('inId:"1" is:flagged');
		});
	});

	it('should not alter query if folderId missing', async () => {
		const interceptor = createSoapAPIInterceptor<SearchRequest>('Search');

		searchSoapApi({
			query: 'whatever',
			limit: 10,
			sortBy: 'flagAsc'
		});

		const receivedRequest = await interceptor;
		expect(receivedRequest.query).toBe('whatever');
	});

	describe('sortBy priority', () => {
		it('should add priority:high to query if sortBy priorityDesc and folderId present', async () => {
			const interceptor = createSoapAPIInterceptor<SearchRequest>('Search');

			searchSoapApi({
				folderId: '1',
				limit: 10,
				sortBy: 'priorityDesc'
			});

			const receivedRequest = await interceptor;
			expect(receivedRequest.query).toBe('inId:"1" priority:high');
		});
		it('should add priority:high to query if sortBy priorityAsc and folderId present', async () => {
			const interceptor = createSoapAPIInterceptor<SearchRequest>('Search');

			searchSoapApi({
				folderId: '1',
				limit: 10,
				sortBy: 'priorityAsc'
			});

			const receivedRequest = await interceptor;
			expect(receivedRequest.query).toBe('inId:"1" priority:high');
		});
	});
	describe('sortBy attachment', () => {
		it('should add has:attachment to query if sortBy attachDesc and folderId present', async () => {
			const interceptor = createSoapAPIInterceptor<SearchRequest>('Search');

			searchSoapApi({
				folderId: '1',
				limit: 10,
				sortBy: 'attachDesc'
			});

			const receivedRequest = await interceptor;
			expect(receivedRequest.query).toBe('inId:"1" has:attachment');
		});
		it('should add has:attachment to query if sortBy attachAsc and folderId present', async () => {
			const interceptor = createSoapAPIInterceptor<SearchRequest>('Search');

			searchSoapApi({
				folderId: '1',
				limit: 10,
				sortBy: 'attachAsc'
			});

			const receivedRequest = await interceptor;
			expect(receivedRequest.query).toBe('inId:"1" has:attachment');
		});
	});
});
