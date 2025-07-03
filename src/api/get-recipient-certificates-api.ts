/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Certificate } from 'types/certificates/certificates';

// Define the structure of the API response
type RecipientsCertificatesResponse = {
	totalCount: number; // Total number of recipients
	list: Certificate[]; // Array of certificates
};

export async function getRecipientsCertificates(): Promise<
	{ data: RecipientsCertificatesResponse } | { error: unknown }
> {
	try {
		const response = await fetch(`/service/extension/encryption/smime/recipient/list`, {
			method: 'GET'
		});

		if (!response.ok) {
			console.error('Response not OK:', response.status, response.statusText);
			return { error: response.statusText };
		}

		try {
			const data: RecipientsCertificatesResponse = await response.json();
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
