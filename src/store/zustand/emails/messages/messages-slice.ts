/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { StateCreator } from 'zustand';

import { MessageSliceState, PopulatedItemsSliceState } from '../../../../types';

export const MESSAGES_INITIAL_STATE: MessageSliceState['messagesSlice'] = {
	messageIds: new Set<string>(),
	more: false,
	offset: 0,
	status: null
};
export const createMessageSlice: StateCreator<
	PopulatedItemsSliceState & MessageSliceState,
	[],
	[],
	MessageSliceState
> = () => ({
	messagesSlice: MESSAGES_INITIAL_STATE
});
