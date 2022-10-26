/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { configureStore } from '@reduxjs/toolkit';
import { storeReducers } from '../reducers';
import { getMsg } from '../actions';
import { selectMessage, selectMessages } from '../messages-slice';

describe('Messages Slice', () => {
	describe('GetMsg', () => {
		test('add single message on the store', async () => {
			const store = configureStore({
				reducer: storeReducers
			});
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
