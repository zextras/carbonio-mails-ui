/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { isNil, filter } from 'lodash';

import { getTags } from '../carbonio-ui-commons/store/zustand/tags';

const getTagIdsFromName = (names?: string): string[] => {
	if (!names) return [];

	const tags = getTags();
	const tagMap = new Map(Object.values(tags).map((tag) => [tag.name, tag.id]));

	return names
		.split(',')
		.map((name) => name.trim())
		.filter(Boolean)
		.map((name) => tagMap.get(name) ?? `nil:${name}`);
};

export const getTagIds = (
	t: string | undefined,
	tn: string | undefined
): Array<string> | undefined => {
	if (isNil(t) && isNil(tn)) {
		return undefined;
	}

	if (t === '' && tn === '') {
		return [];
	}

	if (!isNil(t)) {
		return filter(t.split(','), (tag) => tag.trim() !== '');
	}

	return getTagIdsFromName(tn);
};
