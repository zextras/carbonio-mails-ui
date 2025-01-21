/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export async function selectPersonalCertificate(
	password: string,
	id: string
): Promise<{ data: Response } | { error: unknown }> {
	const apiCall = fetch(
		`/service/extension/encryption/smime/personal/select
`,
		{
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				password,
				id
			})
		}
	);
	return Promise.allSettled([apiCall])
		.then(async ([result]) => {
			if (result.status === 'fulfilled') {
				const response = result.value;
				if (response.ok) {
					return { data: response };
				}
				try {
					return await response.json();
				} catch (error) {
					console.error('Error parsing response:', error);
					return { error };
				}
			}
			return { error: result };
		})
		.catch((error) => ({ error }));
}
