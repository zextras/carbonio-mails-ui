/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { act } from '@testing-library/react';
import { rest } from 'msw';
import { getSetupServer } from '../../carbonio-ui-commons/test/jest-setup';
import { populateFoldersStore } from '../../carbonio-ui-commons/test/mocks/store/folders';
import { generateMessage } from '../../tests/generators/generateMessage';
import { generateStore } from '../../tests/generators/store';
import { MsgActionRequest } from '../../types';
import { setMsgFlag, setMsgRead } from '../message-actions';

const createAPIInterceptor = <T>(apiAction: string): Promise<T> =>
	new Promise<T>((resolve, reject) => {
		// Register a handler for the REST call
		getSetupServer().use(
			rest.post(`/service/soap/${apiAction}Request`, async (req, res, ctx) => {
				if (!req) {
					reject(new Error('Empty request'));
				}

				const reqActionParamWrapper = `${apiAction}Request`;
				const params = (await req.json()).Body?.[reqActionParamWrapper];
				resolve(params);

				// Don't care about the actual response
				return res(ctx.json({}));
			})
		);
	});

describe('Messages actions calls', () => {
	describe('Add flag action', () => {
		test('Single id', async () => {
			populateFoldersStore();
			const msg = generateMessage({});
			const store = generateStore({
				messages: {
					searchedInFolder: {},
					messages: [msg],
					status: {}
				}
			});

			const action = setMsgFlag({
				ids: [msg.id],
				dispatch: store.dispatch,
				value: false
			});

			act(() => {
				action.onClick(undefined);
			});

			const requestParameter = await createAPIInterceptor<MsgActionRequest>('MsgAction');
			expect(requestParameter.action.id).toBe(msg.id);
			expect(requestParameter.action.op).toBe('flag');
			expect(requestParameter.action.l).toBeUndefined();
			expect(requestParameter.action.f).toBeUndefined();
			expect(requestParameter.action.tn).toBeUndefined();
		});

		test.todo('Multiple ids');
	});

	describe('Remove flag action', () => {
		test('Single id', async () => {
			populateFoldersStore();
			const msg = generateMessage({});
			const store = generateStore();

			const action = setMsgFlag({
				ids: [msg.id],
				dispatch: store.dispatch,
				value: true
			});

			act(() => {
				action.onClick(undefined);
			});

			const requestParameter = await createAPIInterceptor<MsgActionRequest>('MsgAction');
			expect(requestParameter.action.id).toBe(msg.id);
			expect(requestParameter.action.op).toBe('!flag');
			expect(requestParameter.action.l).toBeUndefined();
			expect(requestParameter.action.f).toBeUndefined();
			expect(requestParameter.action.tn).toBeUndefined();
		});

		test.todo('Multiple ids');
	});

	describe('Mark as read action', () => {
		test('Single id', async () => {
			populateFoldersStore();
			const msg = generateMessage({});
			const store = generateStore();
			const action = setMsgRead({
				ids: [msg.id],
				dispatch: store.dispatch,
				value: false,
				folderId: msg.parent
			});

			act(() => {
				action.onClick(undefined);
			});

			const requestParameter = await createAPIInterceptor<MsgActionRequest>('MsgAction');
			expect(requestParameter.action.id).toBe(msg.id);
			expect(requestParameter.action.op).toBe('read');
			expect(requestParameter.action.l).toBeUndefined();
			expect(requestParameter.action.f).toBeUndefined();
			expect(requestParameter.action.tn).toBeUndefined();
		});

		test.todo('Multiple ids');
	});

	describe('Mark as unread action', () => {
		test('Single id', async () => {
			populateFoldersStore();
			const msg = generateMessage({});
			const store = generateStore();
			const action = setMsgRead({
				ids: [msg.id],
				dispatch: store.dispatch,
				value: true,
				folderId: msg.parent
			});

			act(() => {
				action.onClick(undefined);
			});

			const requestParameter = await createAPIInterceptor<MsgActionRequest>('MsgAction');
			expect(requestParameter.action.id).toBe(msg.id);
			expect(requestParameter.action.op).toBe('!read');
			expect(requestParameter.action.l).toBeUndefined();
			expect(requestParameter.action.f).toBeUndefined();
			expect(requestParameter.action.tn).toBeUndefined();
		});

		test.todo('Multiple ids');
	});

	describe('Mark as spam action', () => {
		test.todo('Single id');

		test.todo('Multiple ids');
	});

	describe('Mark as not spam action', () => {
		test.todo('Single id');

		test.todo('Multiple ids');
	});

	test.todo('Print action');

	test.todo('Show source');

	describe('Move to trash action', () => {
		test.todo('Single id');

		test.todo('Multiple ids');
	});

	describe('Delete action', () => {
		test.todo('Single id');

		test.todo('Multiple ids');
	});

	describe('Delete permanently action', () => {
		test.todo('Single id');

		test.todo('Multiple ids');
	});

	describe('Restore action', () => {
		test.todo('Single id');

		test.todo('Multiple ids');
	});

	describe('Move action', () => {
		test.todo('Single id');

		test.todo('Multiple ids');
	});

	test.todo('Reply action');

	test.todo('Reply all action');

	test.todo('Forward action');

	test.todo('Edit as new action');

	test.todo('Edit draft action');

	test.todo('Send action');

	test.todo('Redirect action');
});
