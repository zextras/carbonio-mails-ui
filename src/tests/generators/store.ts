/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
/* eslint-disable import/no-extraneous-dependencies */

import { getConversationsSliceInitialState } from '../../store/conversations-slice';
import { getEditorsSliceInitialState } from '../../store/editor-slice';
import { getFoldersSliceInitialState } from '../../store/folders-slice';
import { getMessagesSliceInitialState } from '../../store/messages-slice';
import { getSearchSliceInitialiState } from '../../store/searches-slice';
import { StateType } from '../../types';

// export const generateMessagesSliceEntry = () => {};

export const mockEmptyStore = (state?: StateType): StateType => ({
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
	// status: '',
	// sync: {
	// 	status: '',
	// 	intervalId: 0
	// },
	conversations: {
		...getConversationsSliceInitialState(),
		...state?.conversations
	},
	messages: {
		...getMessagesSliceInitialState(),
		...state?.messages
	}
});
