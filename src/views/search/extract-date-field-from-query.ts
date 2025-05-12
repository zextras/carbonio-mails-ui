/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { filter, map } from 'lodash';
import moment from 'moment/moment';

import { Query } from './types/types';

export function extractDateFieldFromQuery(prefix: string, query: Query): Date | null {
	const prefixColon = `${prefix}:`;
	const dateQuery = map(
		filter(query, (v) => v.label.startsWith(prefixColon)),
		(q) => q.label.substring(prefixColon.length)
	);
	if (dateQuery.length === 0) {
		return null;
	}
	return moment(dateQuery[0]).toDate();
}
