/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
/* eslint-disable import/no-extraneous-dependencies */

export type BackupSearchMessage = {
	id: string;
	folderId: string;
	owner: string;
	creationDate: string;
	deletionDate: string;
	subject: string;
	sender: string;
	to: string;
	fragment: string;
};

import produce from 'immer';
import { create } from 'zustand';

import type { DeletedMessageFromAPI } from '../../../types';

export type BackupSearchStore = {
	messages: Record<string, BackupSearchMessage>;
	status: 'empty' | 'loading' | 'completed';
	setMessages: (messages: Array<DeletedMessageFromAPI>) => void;
	setStatus: (status: BackupSearchStore['status']) => void;
};

export const useBackupSearchStore = create<BackupSearchStore>()((set) => ({
	messages: {},
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
	setStatus: (status: BackupSearchStore['status']): void => set({ status })
}));
