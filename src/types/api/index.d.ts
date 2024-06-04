/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export type SearchBackupDeletedMessagesAPIProps = {
	startDate?: string;
	endDate?: string;
	searchString?: string;
};

export type DeletedMessageFromAPI = {
	messageId: string;
	folderId: string;
	owner: string;
	creationDate: string;
	deletionDate: string;
	subject: string;
	sender: string;
	to: string;
	fragment: string;
};

export type SearchBackupDeletedMessagesResponse = {
	messages: Array<DeletedMessageFromAPI>;
};
