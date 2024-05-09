/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { type SearchBackupDeletedMessagesAPIProps } from '../types';

type DeleteMessage = {
	messageId: string;
	sender: string;
	recipient: string;
	creationDate: string;
	subject: string;
};

type SearchBackupDeletedMessagesResponse = {
	messages: Array<DeleteMessage>;
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
	});

	return result.json();
};
