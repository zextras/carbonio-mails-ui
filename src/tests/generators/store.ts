/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
/* eslint-disable import/no-extraneous-dependencies */

import { configureStore, EnhancedStore } from '@reduxjs/toolkit';
import { MAIL_APP_ID } from '../../constants';
import { getConversationsSliceInitialState } from '../../store/conversations-slice';
import { getEditorsSliceInitialState } from '../../store/editor-slice';
import { getFoldersSliceInitialState } from '../../store/folders-slice';
import { getMessagesSliceInitialState } from '../../store/messages-slice';
import { storeReducers } from '../../store/reducers';
import { getSearchSliceInitialiState } from '../../store/searches-slice';
import type { StateType } from '../../types';

/**
 *
 * @param state
 */
export const generateState = (state?: Partial<StateType>): StateType => ({
	editors: {
		...getEditorsSliceInitialState(),
		...state?.editors
	},
	folders: {
		...getFoldersSliceInitialState(),
		...state?.folders
	},
	searches: {
		...getSearchSliceInitialiState(),
		...state?.searches
	},
	conversations: {
		...getConversationsSliceInitialState(),
		...state?.conversations
	},
	messages: {
		...getMessagesSliceInitialState(),
		...state?.messages
	}
});

/**
 *
 * @param initialState
 */
export const generateStore = (initialState?: Partial<StateType>): EnhancedStore<StateType> => {
	const store = configureStore({
		devTools: {
			name: MAIL_APP_ID
		},
		reducer: storeReducers,
		preloadedState: generateState(initialState)
	});

	return store;
};
