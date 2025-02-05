/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
export async function checkEncryptionPassword(
	password: string
): Promise<{ data: Response } | { error: unknown }> {
	const apiCall = fetch(`/service/extension/encryption/password/check`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({ password })
	});
	return Promise.allSettled([apiCall])
		.then(async ([result]) => {
			if (result.status === 'fulfilled') {
				return result.value.ok ? { data: {} as Response } : { error: '' };
			}
			return { error: result.reason };
		})
		.catch((error) => ({ error: error ?? 'Password not found' }));
}
