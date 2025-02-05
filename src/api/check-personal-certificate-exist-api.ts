/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export async function checkPersonalCertificateExist(
	password: string,
	email: string
): Promise<{ data: Response } | { error: unknown }> {
	const apiCall = fetch(`/service/extension/encryption/smime/personal/exist`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ password, email })
	});

	return Promise.allSettled([apiCall])
		.then(async ([result]) => {
			if (result.status === 'fulfilled') {
				return result.value.ok ? { data: result.value } : { error: result.value.statusText };
			}
			return { error: result.reason };
		})
		.catch((error) => ({ error: error ?? 'Request failed' }));
}
