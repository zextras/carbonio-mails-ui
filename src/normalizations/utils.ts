/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { getTags } from '@zextras/carbonio-ui-commons';
import { filter, find, isNil } from 'lodash';

/**
 * Converts the list of string tag names from soapResponse into an array of tag IDs.
 * If a tag name exists, the ID is returned; otherwise, returns 'nil:tagName'.
 */
const getTagIdsFromName = (names: string): Array<string> => {
	const tags = getTags();
	return names
		.split(',')
		.map((name) => name.trim())
		.filter((name) => name)
		.map((name) => {
			const tag = find(tags, { name });
			return tag ? tag.id : `nil:${name}`;
		});
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

	if (!isNil(tn)) {
		return getTagIdsFromName(tn);
	}

	return [];
};
