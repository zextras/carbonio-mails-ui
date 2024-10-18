/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { includes, trim } from 'lodash';

import {
	AuthenticatonHeader,
	AuthenticatonHeaders,
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
): AuthenticatonHeaders {
	const authenticationHeadersArray = headers?.['Authentication-Results']?.split(';');
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
	authenticationHeaders: Record<string, AuthenticatonHeader>
): boolean {
	const headers = Object.keys(authenticationHeaders);
	const validHeaders = ['dkim', 'spf', 'dmarc'];
	return headers.some((header) => validHeaders.includes(header));
}
