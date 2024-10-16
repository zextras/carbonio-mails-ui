/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { includes, trim } from 'lodash';

import { AuthenticatonHeaders, SoapIncompleteMessage } from '../types';

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

const trimAndCheck = (value: string | undefined): string | undefined => {
	const trimmed = trim(value);
	return trimmed === '' ? undefined : trimmed;
};

export function getAuthenticationHeaders(
	headers: SoapIncompleteMessage['_attrs']
): AuthenticatonHeaders {
	const authenticationHeadersArray = headers?.['Authentication-Results']?.split(';');

	const dkimValue = trimAndCheck(
		authenticationHeadersArray?.find((header) => header.match(/dkim=/))
	);
	const dkimPass = !!dkimValue?.match(/dkim=pass/i);

	const spfValue = trimAndCheck(authenticationHeadersArray?.find((header) => header.match(/spf=/)));
	const spfPass = !!spfValue?.match(/spf=pass/i);

	const dmarcValue = trimAndCheck(
		authenticationHeadersArray?.find((header) => header.match(/dmarc=/))
	);
	const dmarcPass = !!dmarcValue?.match(/dmarc=pass/i);

	return {
		dkim: { value: dkimValue, pass: dkimPass },
		spf: { value: spfValue, pass: spfPass },
		dmarc: { value: dmarcValue, pass: dmarcPass }
	};
}
