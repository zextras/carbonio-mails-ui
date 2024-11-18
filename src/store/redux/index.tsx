/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { ReactNode } from 'react';

import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';

import { MAIL_APP_ID } from '../../constants';
import { storeReducers } from '../reducers';

const store = configureStore({
	devTools: {
		name: MAIL_APP_ID
	},
	reducer: storeReducers
});

export const StoreProvider = ({ children }: { children: ReactNode }): React.JSX.Element => (
	<Provider store={store}>{children}</Provider>
);

// @see https://redux.js.org/usage/usage-with-typescript#define-root-state-and-dispatch-types
// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
