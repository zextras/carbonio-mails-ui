/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { find, isNil, filter } from 'lodash';

import { getTags } from '../carbonio-ui-commons/store/zustand/tags';

const getTagIdsFromName = (names: string | undefined): Array<string> => {
	const tags = getTags();
	return (names?.split(',') ?? [])
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

	return getTagIdsFromName(tn);
};
