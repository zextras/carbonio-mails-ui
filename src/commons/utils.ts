/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { Account, getUserSettings, t } from '@zextras/carbonio-shell-ui';
import { find, isArray } from 'lodash';
import moment from 'moment';

import { MailMessagePart } from 'types/messages';

// retrieves locale from preferences, fallbacks to "en" if no locale found.
export const getUserLocale = (): string => {
	const { zimbraPrefLocale = 'en' } = getUserSettings().prefs;
	return zimbraPrefLocale;
};

export const getTimeLabel = (date: number): string => {
	const zimbraPrefLocale = getUserLocale();
	const momentDate = moment(date).locale(zimbraPrefLocale);
	if (momentDate.isSame(new Date(), 'day')) {
		return momentDate.format('LT');
	}
	return momentDate.format('L LT');
};

export const getCompactDateLabel = (date: number): string => {
	const zimbraPrefLocale = getUserLocale();
	const momentDate = moment(date).locale(zimbraPrefLocale);
	if (momentDate.isSame(new Date(), 'day')) {
		return momentDate.format('LT');
	}
	return momentDate.format('MM/DD');
};

export const participantToString = (
	participant: Partial<{ fullName: string; name: string; address: string }> | undefined,
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

export const _CI_REGEX = /^<(.*)>$/;
export const _CI_SRC_REGEX = /^cid:(.*)$/;

const LINE_BREAK_REGEX = /(?:\r\n|\r|\n)/g;

export const plainTextToHTML = (str: string): string => {
	if (str !== undefined && str !== null) {
		return str.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(LINE_BREAK_REGEX, '<br />');
	}
	return '';
};

/**
 * Builds a map of image content IDs to their corresponding mail message parts.
 *
 */
export function buildImageMap(parts: readonly MailMessagePart[]): Record<string, MailMessagePart> {
	return parts.reduce((acc: Record<string, MailMessagePart>, part) => {
		const contentId = part.ci?.trim();
		if (!contentId) return acc;

		const match = _CI_REGEX.exec(contentId);
		if (match) {
			return { ...acc, [match[1]]: part };
		}
		return acc;
	}, {});
}

export function updateImageSrc(
	img: HTMLImageElement,
	imgMap: Record<string, { name: string }>,
	showImage: boolean,
	msgId: string
): void {
	if (img.hasAttribute('dfsrc') && showImage) {
		img.setAttribute('src', img.getAttribute('dfsrc') ?? '');
	}

	const match = _CI_SRC_REGEX.exec(img.getAttribute('src') ?? '');
	if (!match) return;

	const ci = match[1];
	if (imgMap[ci]) {
		img.setAttribute('pnsrc', img.getAttribute('src') ?? '');
		img.setAttribute('src', `/service/home/~/?auth=co&id=${msgId}&part=${imgMap[ci].name}`);
	}
}

export function decodeSurrogatePairs(str: string): string {
	return str.replace(/\\u([\dA-F]{4})\\u([\dA-F]{4})/gi, (_, p1, p2) => {
		const high = parseInt(p1, 16);
		const low = parseInt(p2, 16);

		// Validate surrogate pair range
		if (high >= 0xd800 && high <= 0xdbff && low >= 0xdc00 && low <= 0xdfff) {
			return String.fromCodePoint(high, low);
		}

		// Return original if not a valid surrogate pair
		return `\\u${p1}\\u${p2}`;
	});
}
