/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { useTags, ZIMBRA_STANDARD_COLORS } from '@zextras/carbonio-ui-commons';

import { useHighlightTaggedMessages } from './use-highlight-tagged-messages';

export interface Taggable {
	tags?: string[];
}

export type UseTagBackgroundColorFn = <T extends Taggable>(
	taggable: T,
	options?: UseTagBackgroundColorOptions
) => string | undefined;

export interface UseTagBackgroundColorOptions {
	active?: boolean;
}

export const useTagBackgroundColor: UseTagBackgroundColorFn = (taggable, { active } = {}) => {
	const colorMessageBackgroundFromTagsEnabled = useHighlightTaggedMessages();

	const tagIds = taggable.tags ?? [];
	const tags = useTags(tagIds);

	return colorMessageBackgroundFromTagsEnabled && !active && tagIds
		? tagIds
				.map((tagId) => tags[tagId])
				.map((tag) => {
					if (!tag) {
						return undefined;
					}

					if ('rgb' in tag && tag.rgb) {
						return `${tag.rgb}44`;
					}

					if ('color' in tag && tag.color) {
						const color = ZIMBRA_STANDARD_COLORS[tag.color];

						if (color) {
							return `${color.hex}44`;
						}
					}

					return undefined;
				})
				.filter((tagColor) => tagColor)[0]
		: undefined;
};
