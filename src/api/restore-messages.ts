/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export async function restoreMessagesAPI(messages: Array<string>): Promise<Response> {
	return fetch(`/zx/backup/v1/restoreMessages`, {
		method: 'POST',
		credentials: 'same-origin',
		body: JSON.stringify({ messages })
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
}
