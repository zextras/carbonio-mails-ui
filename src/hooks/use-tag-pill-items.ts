/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useMemo } from 'react';

import {
	resolveTagColorHex,
	sortTagsByName,
	TagPillItem,
	useTags
} from '@zextras/carbonio-ui-commons';

/** Prefix of a tag known only by name: one set by the owner of a shared folder (see getTagIds). */
const SHARED_TAG_PREFIX = 'nil:';

/**
 * The tags of a message or conversation as pills: the user's tags in alphabetical order with their
 * colour, then the tags set by the owner of a shared folder.
 */
export const useTagPillItems = (tagIds: ReadonlyArray<string> | undefined): Array<TagPillItem> => {
	const tags = useTags();
	return useMemo(() => {
		const own: Array<TagPillItem> = [];
		const shared: Array<TagPillItem> = [];
		new Set(tagIds ?? []).forEach((id) => {
			if (id.startsWith(SHARED_TAG_PREFIX)) {
				shared.push({ id, name: id.slice(SHARED_TAG_PREFIX.length), shared: true });
				return;
			}
			const tag = tags[id];
			if (tag) {
				own.push({ id, name: tag.name, color: resolveTagColorHex(tag) });
			}
		});
		return [...sortTagsByName(own), ...sortTagsByName(shared)];
	}, [tagIds, tags]);
};
