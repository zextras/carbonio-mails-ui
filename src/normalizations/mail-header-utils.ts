/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { TFunction } from 'i18next';
import { includes, isEmpty, trim } from 'lodash';

import { SENSITIVITY_VALUES, VALID_MAIL_AUTHENTICATION_HEADERS } from '../constants';
import {
	MailAuthenticationHeader,
	MailAuthenticationHeaders,
	MailSensitivityHeader,
	Sensitivity,
	SoapIncompleteMessage
} from '../types';

function getDomainFromEmail(email: string): string {
	return email.split('@')[1];
}

export function getMessageIsFromExternalDomain(
	headers: SoapIncompleteMessage['_attrs'],
	ownerAccount: string
): boolean {
	const fromAddress = headers?.From;
	if (isEmpty(fromAddress)) {
		return false;
	}
	const ownerDomain = getDomainFromEmail(ownerAccount);
	return !includes(fromAddress, ownerDomain);
}

function trimAndCheck(value: string | undefined): string | undefined {
	const trimmed = trim(value);
	return trimmed === '' ? undefined : trimmed;
}
function findHeader(
	authenticationHeadersArray: Array<string> | undefined,
	regex: RegExp
): string | undefined {
	return authenticationHeadersArray?.find((header) => regex.exec(header));
}

export function getAuthenticationHeaders(
	headers: SoapIncompleteMessage['_attrs']
): MailAuthenticationHeaders {
	const authenticationHeadersArray = headers?.['Authentication-Results']?.split(';');
	if (!authenticationHeadersArray || isEmpty(authenticationHeadersArray)) return {};
	const dkimValue = trimAndCheck(findHeader(authenticationHeadersArray, /dkim=/));
	const dkimPass = !!dkimValue && /dkim=pass/i.exec(dkimValue);

	const spfValue = trimAndCheck(findHeader(authenticationHeadersArray, /spf=/));
	const spfPass = !!spfValue && /spf=pass/i.exec(spfValue);

	const dmarcValue = trimAndCheck(findHeader(authenticationHeadersArray, /dmarc=/));
	const dmarcPass = !!dmarcValue && /dmarc=pass/i.exec(dmarcValue);

	const mailAuthenticationHeaders: MailAuthenticationHeaders = {};
	if (dkimValue) mailAuthenticationHeaders.dkim = { value: dkimValue, pass: !!dkimPass };
	if (spfValue) mailAuthenticationHeaders.spf = { value: spfValue, pass: !!spfPass };
	if (dmarcValue) mailAuthenticationHeaders.dmarc = { value: dmarcValue, pass: !!dmarcPass };

	return mailAuthenticationHeaders;
}

export function getSensitivityHeaderFromAPI(
	headers: SoapIncompleteMessage['_attrs']
): MailSensitivityHeader | undefined {
	if (!headers) return undefined;
	const sensitivity = headers.Sensitivity;
	if (!sensitivity) return undefined;

	switch (sensitivity.toLowerCase()) {
		case 'personal':
			return 'Personal';
		case 'private':
			return 'Private';
		case 'company-confidential':
			return 'Company-Confidential';
		default:
			return undefined;
	}
}
type AuthenticationInfo = MailAuthenticationHeaders | undefined;
export function getAuthenticationInfoFromMailsHeaders(
	authenticationHeaders: Record<string, MailAuthenticationHeader> | undefined
): AuthenticationInfo {
	if (!authenticationHeaders) return undefined;
	return VALID_MAIL_AUTHENTICATION_HEADERS.reduce(
		(previousResult: AuthenticationInfo, header): AuthenticationInfo => {
			let newResult = previousResult;
			if (header in authenticationHeaders) {
				if (!newResult) newResult = {};
				newResult[header] = authenticationHeaders[header];
			}
			return newResult;
		},
		undefined
	);
}

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

export function getMessageIdFromMailHeaders(
	headers: SoapIncompleteMessage['_attrs']
): string | undefined {
	const messageId = headers?.['Message-Id'];
	return messageId ? messageId.trim().replace(/(^<)|(>$)/g, '') : undefined;
}

export function getCreationDateFromMailHeaders(
	headers: SoapIncompleteMessage['_attrs']
): string | undefined {
	return headers?.Date;
}

export function getMessageIsFromDistributionList(
	headers: SoapIncompleteMessage['_attrs']
): boolean {
	const zimbraDL = headers?.['X-Zimbra-DL'];
	const listId = headers?.['List-ID'];
	const listUnsubscribe = headers?.['List-Unsubscribe'];
	return !!(zimbraDL ?? listId ?? listUnsubscribe);
}
