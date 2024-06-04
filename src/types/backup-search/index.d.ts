/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { BACKUP_SEARCH_STATUS } from '../../constants';

export type BackupSearchStatus = (typeof BACKUP_SEARCH_STATUS)[keyof typeof BACKUP_SEARCH_STATUS];

export type BackupSearchStore = {
	messages: Record<string, BackupSearchMessage>;
	status: BackupSearchStatus;
	setMessages: (messages: Array<DeletedMessageFromAPI>) => void;
	setStatus: (status: BackupSearchStore['status']) => void;
};
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
