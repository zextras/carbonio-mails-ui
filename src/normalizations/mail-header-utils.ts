/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { includes } from 'lodash';

import { SoapIncompleteMessage } from '../types';

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
