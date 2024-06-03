/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export const restoreMessagesAPI = (messages: Array<string>): Promise<Response> =>
	fetch(`/zx/backup/v1/restoreMessages`, {
		method: 'POST',
		credentials: 'same-origin',
		body: JSON.stringify({ messages })
	});
