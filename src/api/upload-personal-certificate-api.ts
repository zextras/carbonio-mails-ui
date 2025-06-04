/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { PersonalCertificate } from 'store/certificates/store';

export async function uploadPersonalCertificate(
	certificate: PersonalCertificate,
	password: string,
	isSelected?: boolean
): Promise<{ data: Response } | { error: unknown }> {
	try {
		const response = await fetch(`/service/extension/encryption/smime/personal`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				password,
				privateKey: certificate.privateKey,
				certificate: certificate.certificate,
				caCertificate: certificate.caCertificate,
				selected: isSelected
			})
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
