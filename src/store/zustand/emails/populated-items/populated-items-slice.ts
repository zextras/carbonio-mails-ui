/* eslint-disable no-param-reassign */
/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { StateCreator } from 'zustand';

import { PopulatedItemsSliceState, SearchSliceState } from '../../../../types';

export const POPULATED_ITEMS_SLICE_INITIAL_STATE = {
	messages: {},
	conversations: {},
	conversationsStatus: {},
	messagesStatus: {}
};
export const createPopulatedItemsSlice: StateCreator<
	PopulatedItemsSliceState & SearchSliceState,
	[],
	[],
	PopulatedItemsSliceState
> = () => ({
	populatedItemsSlice: POPULATED_ITEMS_SLICE_INITIAL_STATE
});
