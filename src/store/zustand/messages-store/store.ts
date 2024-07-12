/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { create } from 'zustand';

import { MessagesStoreState } from '../../../types';

export const useMessagesStore = create<MessagesStoreState>()((set, getState) => ({
	messages: {},
	conversations: {}
}));
