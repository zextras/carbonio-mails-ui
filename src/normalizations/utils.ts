/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { find, isNil, filter } from 'lodash';

import { getTags } from '../carbonio-ui-commons/store/zustand/tags';

const getTagIdsFromName = (names: string | undefined): Array<string> => {
	const tags = getTags();

	if (!names) return [];

	return names.split(',').map((name) => {
		const trimmedName = name.trim();
		const tag = find(tags, { name: trimmedName });

		// Return the tag ID if found, otherwise return a fallback value
		return tag ? tag.id : `nil:${trimmedName}`;
	});
};

export const getTagIds = (
	t: string | undefined,
	tn: string | undefined
): Array<string> | undefined => {
	if (isNil(t) && isNil(tn)) {
		return undefined;
	}

	// Check if both t and tn are empty strings
	// this is the case when the last remaining tag is removed
	if (t === '' && tn === '') {
		return [];
	}

	if (!isNil(t)) {
		return filter(t.split(','), (tag) => tag.trim() !== '');
	}

	if (!isNil(tn)) {
		return getTagIdsFromName(tn);
	}

	return undefined;
};
