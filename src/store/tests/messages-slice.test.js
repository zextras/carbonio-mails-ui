/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { generateStore } from '../../tests/generators/store';
import { getMsgAsyncThunk } from '../actions';
import { selectMessage, selectMessages } from '../messages-slice';

describe('Messages Slice', () => {
	describe('GetMsg', () => {
		test('add single message on the store', async () => {
			const store = generateStore();
			const messages = selectMessages(store.getState());
			expect(messages).toEqual({});
			const msgId = '1';
			await store.dispatch(getMsgAsyncThunk({ msgId }));
			const state = store.getState();
			const readMessage = selectMessage(state, msgId);
			expect(readMessage).toBeDefined();
			expect(readMessage.parts.length).toBeGreaterThan(0);
		});
	});
});
