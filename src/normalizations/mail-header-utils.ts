/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { TFunction } from 'i18next';
import { includes, isEmpty, trim } from 'lodash';

import { PRIVATE_SENSITIVITY_HEADERS, VALID_MAIL_AUTHENTICATION_HEADERS } from '../constants';
import {
	MailAuthenticationHeader,
	MailAuthenticationHeaders,
	MailSensitivityHeader,
	SoapIncompleteMessage
} from '../types';

function getDomainFromEmail(email: string): string {
	return email.split('@')[1];
}

export function getIsFromExternalDomain(
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

	return {
		dkim: { value: dkimValue, pass: !!dkimPass },
		spf: { value: spfValue, pass: !!spfPass },
		dmarc: { value: dmarcValue, pass: !!dmarcPass }
	};
}

export function getSensitivityHeader(
	headers: SoapIncompleteMessage['_attrs']
): Lowercase<MailSensitivityHeader> | undefined {
	if (!headers) return undefined;
	const sensitivity = headers.Sensitivity;
	switch (sensitivity) {
		case 'Personal':
			return 'personal';
		case 'Private':
			return 'private';
		case 'Company-Confidential':
			return 'company-confidential';
		default:
			return undefined;
	}
}

export function getHasAuthenticationHeaders(
	authenticationHeaders: Record<string, MailAuthenticationHeader> | undefined
): boolean {
	if (!authenticationHeaders) return false;
	const headers = Object.keys(authenticationHeaders);
	return headers.some((header) => VALID_MAIL_AUTHENTICATION_HEADERS.includes(header));
}

export function getMailAuthenticationHeaderLabel(
	t: TFunction,
	authenticationHeaders: Record<string, MailAuthenticationHeader> | undefined
): string | undefined {
	if (!authenticationHeaders) return undefined;
	const validHeaders = Object.keys(authenticationHeaders).filter((header) =>
		VALID_MAIL_AUTHENTICATION_HEADERS.includes(header)
	);

	const values = validHeaders.map((validHeader) =>
		authenticationHeaders[validHeader]?.pass
			? `${validHeader}=${t('label.pass', 'pass')}`
			: `${validHeader}=${t('label.fail', 'fail')}`
	);

	return values.join(', ');
}

export function getAuthenticationHeadersIcon(
	authenticationHeaders: Record<string, MailAuthenticationHeader> | undefined
): string {
	if (!authenticationHeaders) return 'warning';
	const numberOfPassedHeaders = Object.values(authenticationHeaders).filter(
		(header) => header.pass === true
	).length;
	if (numberOfPassedHeaders === 3) return 'success';
	return 'warning';
}

export function getIsSensitive(sensitivity: MailSensitivityHeader | undefined): boolean {
	if (!sensitivity) return false;

	const lowerCaseSensitivity = sensitivity.toLowerCase();
	return PRIVATE_SENSITIVITY_HEADERS.some(
		(header) => header.toLowerCase() === lowerCaseSensitivity
	);
}

export function getMailSensitivityIconColor(
	sensitivity: MailSensitivityHeader | undefined
): string {
	if (!sensitivity) {
		return 'warning';
	}
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

export function getMailSensitivityLabel(
	t: TFunction,
	sensitivity: MailSensitivityHeader | undefined
): string {
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

export function getIsDistributionList(headers: SoapIncompleteMessage['_attrs']): boolean {
	const zimbraDL = headers?.['X-Zimbra-DL'];
	const listId = headers?.['List-ID'];
	const listUnsubscribe = headers?.['List-Unsubscribe'];
	return !!(zimbraDL ?? listId ?? listUnsubscribe);
}
