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

import { DeletedMessageFromAPI } from '../../../api/search-backup-deleted-messages';

export type BackupSearchStore = {
	messages: Record<string, BackupSearchMessage>;
	status: 'empty' | 'loading' | 'completed';
	setMessages: (messages: Array<DeletedMessageFromAPI>) => void;
	setStatus: (status: BackupSearchStore['status']) => void;
};

const mockMessages = {
	'8402': {
		id: '8402',
		folderId: '6401',
		owner: '71472012-34b6-4c45-a1f3-f17eba5f492a',
		creationDate: '2024-04-04T12:21:14Z',
		deletionDate: '2024-05-14T12:16:18.028Z',
		subject: 'UNCHECKED contents in mail FROM [127.0.0.1] <zextras@demo.zextras.io>',
		sender: '"Content-filter at kc-dev4-u22-ce.demo.zextras.io"\r\n <zextras@demo.zextras.io>',
		to: '<zextras@demo.zextras.io>',
		fragment:
			'No viruses were found. Content type: Unchecked Internal reference code for the message is 108664-01/QdneQnGqgWdu First upstream SMTP client IP ...'
	},
	'4802': {
		id: '4802',
		folderId: '4462',
		owner: '71472012-34b6-4c45-a1f3-f17eba5f492a',
		creationDate: '2024-04-05T04:00:25Z',
		deletionDate: '2024-05-14T09:54:16.61Z',
		subject: '***UNCHECKED*** Cron <zextras@kc-dev4-u22-ce> /opt/zextras/libexec/zmqueuelog',
		sender: 'root@demo.zextras.io (Cron Daemon)',
		to: 'zextras@demo.zextras.io',
		fragment:
			'postqueue: fatal: Queue report unavailable - mail system is down (Connect to the Postfix showq service: Connection refused)'
	}
};

export const useBackupSearchStore = create<BackupSearchStore>()((set) => ({
	messages: mockMessages,
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
