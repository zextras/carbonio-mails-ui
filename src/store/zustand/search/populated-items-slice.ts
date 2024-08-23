/* eslint-disable no-param-reassign */
/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { StateCreator } from 'zustand';

import { PopulatedItemsSliceState, SearchSliceState } from '../../../types';

export const POPULATED_ITEMS_INITIAL_STATE = {
	messages: {},
	conversations: {},
	conversationsStatus: {}
};
export const createPopulatedItemsSlice: StateCreator<
	PopulatedItemsSliceState & SearchSliceState,
	[],
	[],
	PopulatedItemsSliceState
> = (set) => ({
	populatedItems: POPULATED_ITEMS_INITIAL_STATE
});
