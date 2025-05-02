/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import axios from 'axios';

export async function restoreMessagesApi(
	messages: Array<string>
): Promise<object | { error: unknown }> {
	return axios
		.post('/zx/backup/v1/restoreMessages', { messages }, { withCredentials: true })
		.then(() => ({}))
		.catch((error) => ({ error }));
}
