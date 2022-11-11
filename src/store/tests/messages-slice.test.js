/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';
import { configureStore } from '@reduxjs/toolkit';
import { storeReducers } from '../reducers';
import { getMsg } from '../actions';
import { selectMessage, selectMessages } from '../messages-slice';
import { generateState } from '../../tests/generators/store';
import { MAIL_APP_ID } from '../../constants';

describe('Messages Slice', () => {
	describe('GetMsg', () => {
		test('add single message on the store', async () => {
			const store = configureStore({
				devTools: {
					name: MAIL_APP_ID
				},
				reducer: storeReducers,
				preloadedState: generateState()
			});

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
			const msgId = '1';
			await store.dispatch(getMsg({ msgId }));
			const state = store.getState();
			const readMessage = selectMessage(state, msgId);
			expect(readMessage).toBeDefined();
			expect(readMessage.parts.length).toBeGreaterThan(0);
		});
	});
});
