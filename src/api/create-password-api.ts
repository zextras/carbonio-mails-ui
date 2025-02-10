/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export async function createEncryptionPassword(
	password: string,
	isReset?: boolean
): Promise<{ data: Response } | { error: unknown }> {
	try {
		const response = await fetch(
			`/service/extension/encryption/password${isReset ? '/reset' : ''}`,
			{
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ password })
			}
		);

		if (!response.ok) {
			console.error('Response not OK:', response.status, response.statusText);
			return { error: response.statusText };
		}

		try {
			return { data: response };
		} catch (error) {
			console.error('Error parsing response:', error);
			return { error };
		}
	} catch (error) {
		console.error('Error during fetch:', error);
		return { error };
	}
}
