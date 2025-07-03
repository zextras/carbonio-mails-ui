/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Certificate } from 'types/certificates/certificates';

export async function getPersonalCertificates(
	email?: string
): Promise<{ data: Certificate[] } | { error: unknown }> {
	try {
		const response = await fetch(
			`/service/extension/encryption/smime/personal/list/${email ?? ''}`,
			{
				method: 'GET'
			}
		);

		if (!response.ok) {
			console.error('Response not OK:', response.status, response.statusText);
			return { error: response.statusText };
		}

		try {
			const data: Certificate[] = await response.json();
			return { data };
		} catch (error) {
			console.error('Error parsing JSON response:', error);
			return { error };
		}
	} catch (error) {
		console.error('Error during fetch:', error);
		return { error };
	}
}
