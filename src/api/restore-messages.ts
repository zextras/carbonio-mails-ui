/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { apiWrapper } from '../carbonio-ui-commons/helpers/api-wrapper';

export async function restoreMessagesAPI(
	messages: Array<string>
): Promise<{ data: Response } | { error: unknown }> {
	const apiCall = fetch(`/zx/backup/v1/restoreMessages`, {
		method: 'POST',
		credentials: 'same-origin',
		body: JSON.stringify({ messages })
	});

	return apiWrapper(apiCall);
}
