/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { type SearchBackupDeletedMessagesAPIProps } from '../types';

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

	// return {
	// 	messages: [
	// 		{
	// 			messageId: '57205',
	// 			folderId: '2',
	// 			owner: '71472012-34b6-4c45-a1f3-f17eba5f492a',
	// 			creationDate: '2024-05-20T13:44:23Z',
	// 			deletionDate: '2024-05-20T13:46:01.364Z',
	// 			subject: '***UNCHECKED*** 5_20_15_43 1',
	// 			sender: 'Carbonio Admin <zextras@demo.zextras.io>',
	// 			to: 'zextras@demo.zextras.io',
	// 			fragment: '--'
	// 		},
	// 		{
	// 			messageId: '57210',
	// 			folderId: '2',
	// 			owner: '71472012-34b6-4c45-a1f3-f17eba5f492a',
	// 			creationDate: '2024-05-20T13:44:43Z',
	// 			deletionDate: '2024-05-20T13:45:57.68Z',
	// 			subject: '***UNCHECKED*** 5_20_15_43 2',
	// 			sender: 'Carbonio Admin <zextras@demo.zextras.io>',
	// 			to: 'zextras@demo.zextras.io',
	// 			fragment: '--'
	// 		},
	// 		{
	// 			messageId: '46127',
	// 			folderId: '2',
	// 			owner: '71472012-34b6-4c45-a1f3-f17eba5f492a',
	// 			creationDate: '2024-05-20T09:11:52Z',
	// 			deletionDate: '2024-05-20T09:16:07.074Z',
	// 			subject: '***UNCHECKED*** maggio20 gdfgddgf',
	// 			sender: 'Carbonio Admin <zextras@demo.zextras.io>',
	// 			to: 'zextras@demo.zextras.io',
	// 			fragment: 'maggio20'
	// 		},
	// 		{
	// 			messageId: '46134',
	// 			folderId: '2',
	// 			owner: '71472012-34b6-4c45-a1f3-f17eba5f492a',
	// 			creationDate: '2024-05-20T09:12:37Z',
	// 			deletionDate: '2024-05-20T09:16:02.862Z',
	// 			subject: '***UNCHECKED*** aaaa',
	// 			sender: 'Carbonio Admin <zextras@demo.zextras.io>',
	// 			to: 'zextras@demo.zextras.io',
	// 			fragment: '--'
	// 		},
	// 		{
	// 			messageId: '46140',
	// 			folderId: '2',
	// 			owner: '71472012-34b6-4c45-a1f3-f17eba5f492a',
	// 			creationDate: '2024-05-20T09:12:48Z',
	// 			deletionDate: '2024-05-20T09:15:59.337Z',
	// 			subject: '***UNCHECKED*** rtyrrtyrty',
	// 			sender: 'Carbonio Admin <zextras@demo.zextras.io>',
	// 			to: 'zextras@demo.zextras.io',
	// 			fragment: '--'
	// 		},
	// 		{
	// 			messageId: '46145',
	// 			folderId: '2',
	// 			owner: '71472012-34b6-4c45-a1f3-f17eba5f492a',
	// 			creationDate: '2024-05-20T09:12:59Z',
	// 			deletionDate: '2024-05-20T09:15:55.597Z',
	// 			subject: '***UNCHECKED*** bvbnbvnbn',
	// 			sender: 'Carbonio Admin <zextras@demo.zextras.io>',
	// 			to: 'zextras@demo.zextras.io',
	// 			fragment: '--'
	// 		}
	// 	]
	// };
};
