/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { StateCreator } from 'zustand';

import { MessagesIndexSliceState, PopulatedItemsSliceState } from '../../../../types';

export const MESSAGES_INDEX_SLICE_INITIAL_STATE: MessagesIndexSliceState['messagesIndexSlice'] = {
	messagesIds: new Set<string>(),
	more: false,
	offset: 0,
	status: null
};
export const createMessagesIndexSlice: StateCreator<
	PopulatedItemsSliceState & MessagesIndexSliceState,
	[],
	[],
	MessagesIndexSliceState
> = () => ({
	messagesIndexSlice: MESSAGES_INDEX_SLICE_INITIAL_STATE
});
