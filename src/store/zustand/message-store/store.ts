/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { create } from 'zustand';

import { createMessageSlice } from './message-slice';
import { createSearchSlice } from './searchSlice';
import { MessagesSliceState, SearchSliceState } from '../../../types';

export const useMessageStore = create<MessagesSliceState & SearchSliceState>((...a) => ({
	...createSearchSlice(...a),
	...createMessageSlice(...a)
}));
