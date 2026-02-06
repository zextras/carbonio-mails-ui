/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { TFunction } from 'i18next';

import { VALID_MAIL_AUTHENTICATION_HEADERS } from 'constants/index';
import { MailAuthenticationHeaders, Sensitivity } from 'types/index.d';
import { useCallback, useEffect, useState } from 'react';

export function getMailAuthenticationHeaderLabel(
	t: TFunction,
	authenticationHeaders: MailAuthenticationHeaders
): string {
	const headerLabels: string[] = [];
	VALID_MAIL_AUTHENTICATION_HEADERS.forEach((header) => {
		const result = authenticationHeaders[header];
		let status: string;

		if (!result) {
			status = 'missing';
		} else if (result.pass) {
			status = 'pass';
		} else {
			status = 'fail';
		}

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
export function getMailSensitivityIconColor(sensitivity: Sensitivity): string {
	const normalizedSensitivity = sensitivity.trim().toLowerCase();

	switch (normalizedSensitivity) {
		case 'private':
			return 'error';
		case 'company-confidential':
			return 'info';
		default:
			return 'warning';
	}
}

export function getMailSensitivityLabel(t: TFunction, sensitivity: Sensitivity): string {
	const normalizedSensitivity = sensitivity.trim().toLowerCase();

	switch (normalizedSensitivity) {
		case 'private':
			return t('label.mail_sensitivity_private', 'Sensitivity Private');
		case 'company-confidential':
			return t('label.mail_sensitivity_company_confidential', 'Sensitivity Company-Confidential');
		default:
			return t('label.mail_sensitivity_unknown', 'Sensitivity Unknown');
	}
}

export const useContainerWidth = (
	ref: React.RefObject<HTMLDivElement>,
	threshold: number
): boolean => {
	const [width, setWidth] = useState(0);

	const handleResize = useCallback((entries: ResizeObserverEntry[]): void => {
		setWidth(entries[0].contentRect.width);
	}, []);

	useEffect(() => {
		if (!ref.current) return undefined;

		const observer = new ResizeObserver(handleResize);

		observer.observe(ref.current);

		return (): void => {
			observer?.disconnect();
		};
	}, [ref, handleResize]);

	return width >= threshold;
};
