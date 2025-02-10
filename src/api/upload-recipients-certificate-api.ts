/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
export async function uploadRecipientCertificate(
	certificateContent: string | ArrayBuffer
): Promise<{ data: Response } | { error: unknown }> {
	try {
		const response = await fetch(`/service/extension/encryption/smime/recipient`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ certificate: certificateContent })
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
