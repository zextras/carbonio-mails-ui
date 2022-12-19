/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';
import fetchMock from 'jest-fetch-mock';
import { getMsg } from '../actions';
import { selectMessage, selectMessages } from '../messages-slice';
import { generateStore } from '../../tests/generators/store';
import { getSetupServerApi } from '../../carbonio-ui-commons/test/jest-setup';

describe('Messages Slice', () => {
	describe('GetMsg', () => {
		test('add single message on the store', async () => {
			const store = generateStore();
			const messages = selectMessages(store.getState());
			expect(messages).toEqual({});
			const msgId = '1';
			await store.dispatch(getMsg({ msgId }));
			const state = store.getState();
			const readMessage = selectMessage(state, msgId);
			expect(readMessage).toBeDefined();
			expect(readMessage.parts.length).toBeGreaterThan(0);
		});
	});
});
