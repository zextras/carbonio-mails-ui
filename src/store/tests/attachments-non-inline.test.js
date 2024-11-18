/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { generateStore } from '../../tests/generators/store';
import { getMsgAsyncThunk } from '../actions';
import { selectMessages } from '../messages-slice';

describe('Messages Slice', () => {
	describe('GetMsg', () => {
		test('add single message on the store', async () => {
			const store = generateStore();

			// const options = { store };
			//
			// setupTest(<Dummy />, options);
			// expect(screen.getByTestId('dummy-id')).toBeInTheDocument();
			// expect(screen.getByTestId('dummy-id').innerHTML).toEqual('0');
			// const msgId = '1';
			// await store.dispatch(getMsg({ msgId }));
			// const state = store.getState();
			// const readMessage = selectMessage(state, msgId);
			// expect(screen.getByTestId('dummy-id').innerHTML).toEqual('1');

			const messages = selectMessages(store.getState());
			expect(messages).toEqual({});
			const msgId = '3';
			await store.dispatch(getMsgAsyncThunk({ msgId }));
			const state = store.getState();

			// Create and wait for the component to be rendered
			// const { user } = setupTest(<MessagePreviewPanel />, { store });
			// await waitFor(() => {
			// 	expect(screen.getByTestId('edit-view-editor')).toBeInTheDocument();
			// });
			// const readMessage = selectMessage(state, msgId);
			// expect(readMessage).toBeDefined();
			// expect(readMessage.parts.length).toBeGreaterThan(0);
		});
	});
});
