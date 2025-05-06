/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export async function restoreMessagesApi(
	messages: Array<string>
<<<<<<< Updated upstream
): Promise<object | { error: unknown }> {
=======
): Promise<Response | { error: unknown }> {
>>>>>>> Stashed changes
	return fetch(`/zx/backup/v1/restoreMessages`, {
		method: 'POST',
		credentials: 'same-origin',
		body: JSON.stringify({ messages })
<<<<<<< Updated upstream
	})
		.then(() => ({}))
		.catch((error) => ({ error }));
=======
	}).catch((error) => ({ error }));
>>>>>>> Stashed changes
}
