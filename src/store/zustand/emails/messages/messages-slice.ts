/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { StateCreator } from 'zustand';

import { MessageSliceState, PopulatedItemsSliceState, SearchSliceState } from '../../../../types';

export const MESSAGES_INITIAL_STATE: MessageSliceState['messages'] = {
	messageIds: new Set<string>(),
	more: false,
	offset: 0,
	status: null
};
export const createMessageSlice: StateCreator<
	SearchSliceState & PopulatedItemsSliceState & MessageSliceState,
	[],
	[],
	MessageSliceState
> = () => ({
	messages: MESSAGES_INITIAL_STATE
});
