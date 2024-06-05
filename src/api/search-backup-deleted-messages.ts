/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { apiWrapper } from '../carbonio-ui-commons/helpers/api-wrapper';
import type {
	SearchBackupDeletedMessagesResponse,
	SearchBackupDeletedMessagesAPIProps
} from '../types';

export async function searchBackupDeletedMessagesAPI({
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
		searchParams.set('after', startDate);
	}
	if (endDate) {
		searchParams.set('before', endDate);
	}
	if (searchString) {
		searchParams.set('searchString', searchString);
	}

	const apiCall = fetch(`${searchURL}?${searchParams}`, {
		method: 'GET',
		credentials: 'same-origin'
	});

	return apiWrapper(apiCall);
}
