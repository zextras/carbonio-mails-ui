/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import axios from 'axios';

import type {
	SearchBackupDeletedMessagesResponse,
	SearchBackupDeletedMessagesAPIProps
} from '../types';

export async function searchBackupDeletedMessagesApi({
	startDate,
	endDate,
	searchString
}: SearchBackupDeletedMessagesAPIProps): Promise<
	| {
			data: SearchBackupDeletedMessagesResponse;
	  }
	| { error: unknown }
> {
	const searchURL = '/zx/backup/v1/searchDeleted';
	const searchParams = new URLSearchParams();
	if (startDate) {
		searchParams.set('after', startDate.toISOString());
	}
	if (endDate) {
		searchParams.set('before', endDate.toISOString());
	}
	if (searchString) {
		searchParams.set('searchString', searchString);
	}
	return axios
		.get(`${searchURL}`, {
			params: searchParams,
			withCredentials: true
		})
		.then((res) => ({ data: res.data }))
		.catch((error) => ({ error }));
}
