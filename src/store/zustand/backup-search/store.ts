/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
/* eslint-disable import/no-extraneous-dependencies */

import produce from 'immer';
import { create } from 'zustand';

import type { BackupSearchStore, DeletedMessageFromAPI } from '../../../types';

const mockMessages = {
	'1': {
		id: '1',
		folderId: '1',
		owner: '1',
		creationDate: '1',
		deletionDate: '1',
		subject: '1',
		sender: '1',
		to: '1',
		fragment: '1'
	}
};

export const useBackupSearchStore = create<BackupSearchStore>()((set) => ({
	messages: mockMessages,
	queryParams: {
		endDate: '2024-05-25T22:00:00.000Z',
		startDate: '2024-05-22T22:00:00.000Z',
		searchString: 'test search'
	},
	status: 'empty',
	setMessages: (messages: Array<DeletedMessageFromAPI>): void =>
		set(
			produce((state) => {
				state.messages = messages.reduce((acc, message) => {
					const { messageId } = message;
					return { ...acc, [messageId]: { ...message, id: message.messageId } };
				}, {});
			})
		),
	setStatus: (status: BackupSearchStore['status']): void => set({ status }),
	setQueryParams: (queryParams: BackupSearchStore['queryParams']): void => set({ queryParams })
}));
