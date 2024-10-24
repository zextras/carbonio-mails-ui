/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
/* eslint-disable import/no-extraneous-dependencies */

import produce from 'immer';
import { omit, reduce } from 'lodash';
import { create } from 'zustand';

import type { BackupSearchStore, DeletedMessageFromAPI } from '../../../types';

export const useBackupSearchStore = create<BackupSearchStore>()((set) => ({
	messages: {},
	searchParams: {},
	status: 'empty',
	setMessages: (messages: Array<DeletedMessageFromAPI>): void =>
		set(
			produce((state) => {
				state.messages = reduce(
					messages,
					(acc, message) => {
						const { messageId } = message;
						return {
							...acc,
							[messageId]: omit({ ...message, id: message.messageId }, ['messageId'])
						};
					},
					{}
				);
			})
		),
	setStatus: (status: BackupSearchStore['status']): void => set({ status }),
	setSearchParams: (queryParams: BackupSearchStore['searchParams']): void =>
		set({ searchParams: queryParams })
}));
