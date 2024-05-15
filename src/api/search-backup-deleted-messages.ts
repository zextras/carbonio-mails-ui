/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { type SearchBackupDeletedMessagesAPIProps } from '../types';

export type DeletedMessage = {
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

export type SearchBackupDeletedMessagesResponse = {
	messages: Array<DeletedMessage>;
};

export const searchBackupDeletedMessagesAPI = async ({
	startDate,
	endDate,
	searchString
}: SearchBackupDeletedMessagesAPIProps): Promise<SearchBackupDeletedMessagesResponse> => {
	const searchURL = '/zx/backup/v1/searchDeleted';
	const searchParams = new URLSearchParams();
	if (startDate) {
		searchParams.set('after', startDate);
	}
	if (endDate) {
		searchParams.set('before', endDate);
	}
	if (searchString) {
		searchParams.set('searchString', searchString);
	}

	const result = await fetch(`${searchURL}?${searchParams}`, {
		method: 'GET',
		credentials: 'same-origin'
	})
		.then((resp) => {
			if (!resp.ok) {
				throw new Error('Something went wrong with the search inside the backup');
			}
			return resp;
		})
		.catch(() => {
			throw new Error('Something went wrong with the search inside the backup');
		});

	return result.json();
};
