/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { StateCreator } from 'zustand';

import { MessageIndexSliceState, PopulatedItemsSliceState } from '../../../../types';

export const MESSAGE_INDEX_SLICE_INITIAL_STATE: MessageIndexSliceState['messageIndexSlice'] = {
	messageIdSet: new Set<string>(),
	more: false,
	offset: 0,
	status: null
};
export const createMessageIndexSlice: StateCreator<
	PopulatedItemsSliceState & MessageIndexSliceState,
	[],
	[],
	MessageIndexSliceState
> = () => ({
	messageIndexSlice: MESSAGE_INDEX_SLICE_INITIAL_STATE
});
