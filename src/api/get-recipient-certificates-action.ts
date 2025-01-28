/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Certificate } from '../types/certificates/certificates';

// Define the structure of the API response
type RecipientsCertificatesResponse = {
	totalCount: number; // Total number of recipients
	list: Certificate[]; // Array of certificates
};
export async function getRecipientsCertificates(): Promise<
	{ data: RecipientsCertificatesResponse } | { error: unknown }
> {
	const apiCall = fetch(`/service/extension/encryption/smime/recipient/list`, {
		method: 'GET'
	});

	return Promise.allSettled([apiCall])
		.then(async ([result]) => {
			if (result.status === 'fulfilled') {
				const response = result.value;

				if (response.ok) {
					try {
						// Parse the body as JSON (assuming the API returns JSON)
						const responseData = await response.json();
						return { data: responseData };
					} catch (error) {
						// Handle parsing error
						console.error('Error parsing response:', error);
						return { error };
					}
				} else {
					// Handle non-200 HTTP statuses
					console.error('Response not OK:', response.status, response.statusText);
					return { error: response.statusText };
				}
			}

			// Handle promise rejection
			return { error: result.reason };
		})
		.catch((error) => {
			// Handle other errors
			console.error('Error during fetch:', error);
			return { error };
		});
}
