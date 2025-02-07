/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export async function deleteRecipientCertificate(
	email: string
): Promise<{ data: Response } | { error: unknown }> {
	try {
		const response = await fetch(`/service/extension/encryption/smime/recipient/${email}`, {
			method: 'DELETE',
			headers: { 'Content-Type': 'application/json' }
		});

		if (!response.ok) {
			console.error('Response not OK:', response.status, response.statusText);
			return { error: response.statusText };
		}

		return { data: response };
	} catch (error) {
		console.error('Error during fetch:', error);
		return { error };
	}
}
