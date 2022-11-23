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

const store = configureStore({
	devTools: {
		name: MAIL_APP_ID
	},
	reducer: storeReducers
});

export const StoreProvider: FC = ({ children }) => <Provider store={store}>{children}</Provider>;
