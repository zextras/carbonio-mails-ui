/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
export async function getCertificateInfo(): Promise<{ data: Response } | { error: unknown }> {
	const apiCall = fetch(`/services/certificate-manager/certificates`, {
		method: 'GET'
	});
	return Promise.allSettled([apiCall]).then(async ([result]) => {
		if (result.status === 'fulfilled') {
			return result.value.ok ? { data: {} as Response } : { error: '' };
		}
		return { error: result.reason };
	});
}
