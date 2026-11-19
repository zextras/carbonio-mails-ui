/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { getTags } from '@zextras/carbonio-ui-commons';
import { filter, find, isNil } from 'lodash';

/**
 * Splits the `tn` attribute into tag names. The server escapes a comma in a name as `\,` and a
 * backslash as `\\` (TagUtil.encodeTags in carbonio-mailbox), so a plain split would cut those names.
 */
const decodeTagNames = (encoded: string): Array<string> => {
	const names: Array<string> = [];
	let current = '';
	let i = 0;
	while (i < encoded.length) {
		const char = encoded[i];
		if (char === '\\' && i + 1 < encoded.length) {
			current += encoded[i + 1];
			i += 2;
		} else {
			if (char === ',') {
				names.push(current);
				current = '';
			} else {
				current += char;
			}
			i += 1;
		}
	}
	names.push(current);
	return names;
};

/**
 * Converts the list of string tag names from soapResponse into an array of tag IDs.
 * If a tag name exists, the ID is returned; otherwise, returns 'nil:tagName'.
 */
const getTagIdsFromName = (names: string): Array<string> => {
	const tags = getTags();
	return decodeTagNames(names)
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
