/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { combineReducers } from '@reduxjs/toolkit';

import { conversationsSliceReducer } from './conversations-slice';
import { messageSliceReducer } from './messages-slice';
import { searchesSliceReducer } from './searches-slice';

export const storeReducers = combineReducers({
	conversations: conversationsSliceReducer,
	messages: messageSliceReducer,
	searches: searchesSliceReducer
});
