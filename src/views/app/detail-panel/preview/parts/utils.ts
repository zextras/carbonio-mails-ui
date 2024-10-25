/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { TFunction } from 'i18next';

import { SENSITIVITY_VALUES, VALID_MAIL_AUTHENTICATION_HEADERS } from '../../../../../constants';
import {
	MailAuthenticationHeaders,
	MailSensitivityHeader,
	Sensitivity
} from '../../../../../types';

export function getMailAuthenticationHeaderLabel(
	t: TFunction,
	authenticationHeaders: MailAuthenticationHeaders
): string {
	const headerLabels: string[] = [];

	VALID_MAIL_AUTHENTICATION_HEADERS.forEach((header) => {
		const result = authenticationHeaders[header];

		if (!result) return;

		const status = result.pass ? 'pass' : 'fail';
		const translatedStatus = t(`label.${status}`, status);

		headerLabels.push(`${header}=${translatedStatus}`);
	});

	return headerLabels.join(', ');
}

export function getAuthenticationHeadersIconColor(
	authenticationHeaders: MailAuthenticationHeaders
): string {
	const allHeaderPassing = VALID_MAIL_AUTHENTICATION_HEADERS.every(
		(header) => authenticationHeaders[header]?.pass === true
	);
	if (allHeaderPassing) return 'success';
	return 'warning';
}

export function getSensitivityFromMailsHeaders(
	sensitivity?: MailSensitivityHeader
): Sensitivity | undefined {
	if (!sensitivity) return undefined;

	return SENSITIVITY_VALUES.find((header) => header.toLowerCase() === sensitivity.toLowerCase());
}

export function getMailSensitivityIconColor(sensitivity: MailSensitivityHeader): string {
	const normalizedSensitivity = sensitivity.trim().toLowerCase();

	switch (normalizedSensitivity) {
		case 'personal':
			return 'warning';
		case 'private':
			return 'error';
		case 'company-confidential':
			return 'info';
		default:
			return 'warning';
	}
}

export function getMailSensitivityLabel(t: TFunction, sensitivity: MailSensitivityHeader): string {
	if (!sensitivity) {
		return t('label.mail_sensitivity_unknown', 'Sensitivity Unknown');
	}

	const normalizedSensitivity = sensitivity.trim().toLowerCase();

	switch (normalizedSensitivity) {
		case 'personal':
			return t('label.mail_sensitivity_personal', 'Sensitivity Personal');
		case 'private':
			return t('label.mail_sensitivity_private', 'Sensitivity Private');
		case 'company-confidential':
			return t('label.mail_sensitivity_company_confidential', 'Sensitivity Company-Confidential');
		default:
			return t('label.mail_sensitivity_unknown', 'Sensitivity Unknown');
	}
}
