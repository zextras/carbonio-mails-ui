/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { act } from '@testing-library/react';
import { rest } from 'msw';
import { generateStore } from '../../tests/generators/store';
import { getSetupServer } from '../../carbonio-ui-commons/test/jest-setup';
import { MsgActionRequest } from '../../types';
import { dispatchMsgMove } from '../message-actions';

describe('Message Action', () => {
	// Test for restore the trashed mail
	test('restore trashed email', async () => {
		const store = generateStore();
		const msgActionInterceptor = new Promise<MsgActionRequest>((resolve, reject) => {
			// Register a handler for the REST call
			getSetupServer().use(
				rest.post('/service/soap/MsgActionRequest', async (req, res, ctx) => {
					if (!req) {
						reject(new Error('Empty request'));
					}
					const action = (await req.json()).Body.MsgActionRequest;
					resolve(action);

					// Don't care about the actual response
					return res(ctx.json({}));
				})
			);
		});
		act(() => {
			dispatchMsgMove(store.dispatch, ['1', '2'], '2');
		});
		const req = await msgActionInterceptor;
		expect(req.action.op).toBe('move');
		expect(req.action.id).toBe('1,2');
		expect(req.action.l).toBe('2');
	});
});
