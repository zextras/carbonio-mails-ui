/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { combineReducers, configureStore } from '@reduxjs/toolkit';
import React, { FC } from 'react';
import { Provider } from 'react-redux';
import { MAIL_APP_ID } from '../../constants';
import { conversationsSliceReducer } from '../conversations-slice';
import { editorSliceReducer } from '../editor-slice';
import { folderSliceReducer } from '../folders-slice';
import { messageSliceReducer } from '../messages-slice';

export const store = configureStore({
	devTools: {
		name: MAIL_APP_ID
	},
	// middleware: __CARBONIO_DEV__
	// 	? // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
	// 	  (getDefaultMiddleware) => getDefaultMiddleware().concat(logger)
	// 	: // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
	// 	  (getDefaultMiddleware) => getDefaultMiddleware(),
	reducer: combineReducers({
		folders: folderSliceReducer,
		conversations: conversationsSliceReducer,
		editors: editorSliceReducer,
		messages: messageSliceReducer
	})
});

export const StoreProvider: FC = ({ children }) => <Provider store={store}>{children}</Provider>;
