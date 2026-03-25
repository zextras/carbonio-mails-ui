/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { StateCreator } from 'zustand';

import { MessageIndexSliceState } from 'types/search';

export const MESSAGE_INDEX_SLICE_INITIAL_STATE: MessageIndexSliceState['messageIndexSlice'] = {
	messageListIndex: [],
	more: false,
	offset: 0,
	status: null
};
export const createMessageIndexSlice: StateCreator<MessageIndexSliceState> = () => ({
	messageIndexSlice: MESSAGE_INDEX_SLICE_INITIAL_STATE
});
