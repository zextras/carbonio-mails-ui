/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { includes, isEmpty, trim } from 'lodash';

import { MailAuthenticationHeaders, Sensitivity } from 'types/messages';
import { SoapIncompleteMessage } from 'types/soap';

function getDomainFromEmail(email: string): string {
	return email.split('@')[1];
}

export function getMessageIsFromExternalDomainFromAPI(
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
function normalizeToArray(input: string | string[] | undefined): Array<string> {
	if (input === undefined) {
		return [];
	}
	if (Array.isArray(input)) {
		return input.join(' ').split(';');
	}
	return input.split(';');
}

export function getAuthenticationHeadersFromAPI(
	headers: SoapIncompleteMessage['_attrs']
): MailAuthenticationHeaders {
	const authenticationHeadersArray = normalizeToArray(headers?.['Authentication-Results']);
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
): Sensitivity | undefined {
	const sensitivity = headers?.Sensitivity;
	if (!sensitivity) return undefined;

	switch (sensitivity.toLowerCase()) {
		case 'private':
			return 'Private';
		case 'company-confidential':
			return 'Company-Confidential';
		default:
			return undefined;
	}
}

export function getMessageIdFromMailHeadersFromAPI(
	headers: SoapIncompleteMessage['_attrs']
): string | undefined {
	const messageId = headers?.['Message-Id'];
	return messageId ? messageId.trim().replace(/(^<)|(>$)/g, '') : undefined;
}

export function getCreationDateFromMailHeadersFromAPI(
	headers: SoapIncompleteMessage['_attrs']
): string | undefined {
	return headers?.Date;
}

export function getMessageIsFromDistributionListFromAPI(
	headers: SoapIncompleteMessage['_attrs']
): boolean {
	const zimbraDL = headers?.['X-Zimbra-DL'];
	const listId = headers?.['List-ID'];
	const listUnsubscribe = headers?.['List-Unsubscribe'];
	return !!(zimbraDL ?? listId ?? listUnsubscribe);
}
