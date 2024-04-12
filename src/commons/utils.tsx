/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { Account, t } from '@zextras/carbonio-shell-ui';
import { find, isArray } from 'lodash';
import moment from 'moment';

import type { Participant } from '../types';

export const getTimeLabel = (date: number): string => {
	const momentDate = moment(date);
	if (momentDate.isSame(new Date(), 'day')) {
		return momentDate.format('LT');
	}
	if (momentDate.isSame(new Date(), 'week')) {
		return momentDate.format('dddd, LT');
	}
	if (momentDate.isSame(new Date(), 'month')) {
		return momentDate.format('DD MMMM');
	}
	return momentDate.format('DD/MM/YYYY');
};

export const participantToString = (
	participant: Participant | undefined,
	accounts: Array<Account>
): string => {
	const me = find(accounts, ['name', participant?.address]);
	if (me) {
		return t('label.me', 'Me');
	}
	return participant?.fullName || participant?.name || participant?.address || '';
};

export const isAvailableInTrusteeList = (
	trusteeList: string | number | Array<number | string>,
	address: string
): boolean => {
	let trusteeAddress: Array<string> = [];
	let availableInTrusteeList = false;
	if (trusteeList) {
		// eslint-disable-next-line no-nested-ternary
		trusteeAddress = isArray(trusteeList)
			? (trusteeList as string[])
			: typeof trusteeList === 'string'
				? trusteeList?.split(',')
				: [`${trusteeList}`];
	}
	if (trusteeAddress.length > 0) {
		const domain = address.substring(address.lastIndexOf('@') + 1);
		trusteeAddress.forEach((ta) => {
			if (ta === domain || ta === address) {
				availableInTrusteeList = true;
			}
		});
	}
	return availableInTrusteeList;
};

export const LineType = {
	ORIG_UNKNOWN: 'UNKNOWN',
	ORIG_QUOTED: 'QUOTED',
	ORIG_SEP_STRONG: 'SEP_STRONG',
	ORIG_WROTE_STRONG: 'WROTE_STRONG',
	ORIG_WROTE_WEAK: 'WROTE_WEAK',
	ORIG_HEADER: 'HEADER',
	ORIG_LINE: 'LINE',
	HTML_SEP_ID: 'zwchr',
	PLAINTEXT_SEP: '---------------------------',
	NOTES_SEPARATOR: '*~*~*~*~*~*~*~*~*~*',
	SIGNATURE_CLASS: 'signature-div',
	SIGNATURE_PRE_SEP: '---'
} as const;

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const omitBy = (obj: any, check: (arg: unknown) => boolean): any => {
	// eslint-disable-next-line no-param-reassign
	obj = { ...obj };
	// eslint-disable-next-line no-param-reassign
	Object.entries(obj).forEach(([key, value]) => check(value) && delete obj[key]);
	return obj;
};
