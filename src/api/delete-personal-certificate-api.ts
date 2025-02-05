/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export async function deletePersonalCertificate(
	id: string,
	password: string
): Promise<{ data?: Response; error?: unknown }> {
	try {
		const response = await fetch(`/service/extension/encryption/smime/personal`, {
			method: 'DELETE',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ id, password })
		});

		if (!response.ok) {
			try {
				const errorData = await response.json();
				return { error: errorData };
			} catch (jsonError) {
				return { error: 'Unknown error occurred' };
			}
		}

		return { data: response };
	} catch (error) {
		return { error };
	}
}
