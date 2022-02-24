/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { combineReducers } from '@reduxjs/toolkit';
import { folderSliceReducer } from './folders-slice';
import { conversationsSliceReducer } from './conversations-slice';
import { messageSliceReducer } from './messages-slice';
import { editorSliceReducer } from './editor-slice';

export default combineReducers({
	folders: folderSliceReducer,
	conversations: conversationsSliceReducer,
	messages: messageSliceReducer,
	editors: editorSliceReducer
});
