/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { filter, map } from 'lodash';
import moment from 'moment/moment';

import { getUserLocale } from 'commons/utils';
import { Query } from 'views/search/types/types';

export function extractDateFieldFromQuery(prefix: string, query: Query): Date | null {
	const prefixColon = `${prefix}:`;
	const dateQuery = map(
		filter(query, (v) => v.label.startsWith(prefixColon)),
		(q) => q.label.substring(prefixColon.length)
	);
	if (dateQuery.length === 0) {
		return null;
	}

	const userLocale = getUserLocale();
	const dateString = dateQuery[0];

	// Try parsing with locale-specific format first
	const localeFormat = moment.localeData(userLocale).longDateFormat('L');
	let parsedDate = moment(dateString, localeFormat, userLocale, true);

	if (!parsedDate.isValid()) {
		// Fall back to ISO format and other standard formats
		parsedDate = moment(dateString, [
			'YYYY-MM-DD',
			'YYYY/MM/DD',
			'MM/DD/YYYY',
			'DD/MM/YYYY',
			'DD.MM.YYYY'
		]);
	}

	if (!parsedDate.isValid()) {
		// Final fallback to flexible parsing
		parsedDate = moment(dateString);
	}

	return parsedDate.toDate();
}
