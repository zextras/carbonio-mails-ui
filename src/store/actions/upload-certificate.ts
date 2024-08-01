/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
export async function uploadCertificate(
	file: File,
	password: string
): Promise<{ data: Response } | { error: unknown }> {
	const formData = new FormData();
	formData.append('certificate', file);
	const apiCall = fetch(`/services/certificate-manager/certificates?password=${password}`, {
		method: 'PUT',
		body: formData
	});
	return Promise.allSettled([apiCall]).then(async ([result]) => {
		if (result.status === 'fulfilled') {
			return result.value.ok ? { data: {} as Response } : { error: '' };
		}
		return { error: result.reason };
	});
}
