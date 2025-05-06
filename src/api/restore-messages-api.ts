/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export async function restoreMessagesApi(
	messages: Array<string>
): Promise<object | { error: unknown }> {
	return fetch(`/zx/backup/v1/restoreMessages`, {
		method: 'POST',
		credentials: 'same-origin',
		body: JSON.stringify({ messages })
	})
		.then(() => ({}))
		.catch((error) => ({ error }));
}
