/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { configureStore } from '@reduxjs/toolkit';
import React, { FC } from 'react';
import { Provider } from 'react-redux';
import { MAIL_APP_ID } from '../../constants';
import { storeReducers } from '../reducers';

export const store = configureStore({
	devTools: {
		name: MAIL_APP_ID
	},
	// middleware: __CARBONIO_DEV__
	// 	? // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
	// 	  (getDefaultMiddleware) => getDefaultMiddleware().concat(logger)
	// 	: // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
	// 	  (getDefaultMiddleware) => getDefaultMiddleware(),
	reducer: storeReducers
});

export const StoreProvider: FC = ({ children }) => <Provider store={store}>{children}</Provider>;
