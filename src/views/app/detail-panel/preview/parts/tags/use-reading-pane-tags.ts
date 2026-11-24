/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useCallback, useMemo } from 'react';

import {
	resolveTagColorHex,
	sortTagsByName,
	TagPillItem,
	useRunSearchIntegration,
	useTags
} from '@zextras/carbonio-ui-commons';
import { useTranslation } from 'react-i18next';

import type { ReadingPaneTagsProps } from './reading-pane-tags';
import { isSpam } from 'helpers/folders';
import { useTagPillActions } from 'hooks/use-tag-pill-actions';
import { useTagPillItems } from 'hooks/use-tag-pill-items';
import { getConversationMessages } from 'store/emails/store';

/** A quote inside the quoted tag name of a search, as the search grammar takes it. */
const ESCAPED_QUOTE = String.raw`\"`;

type UseReadingPaneTagsArgs = {
	/** A message: its own tags. A conversation: the tags of all its messages. */
	kind: 'message' | 'conversation';
	id: string;
	tagIds: ReadonlyArray<string> | undefined;
	/** Tags can't be changed in Spam, as in the Tag menu of the actions. */
	folderId: string;
};

/** The props of `ReadingPaneTags` for a message or a conversation of the reading pane. */
export const useReadingPaneTags = ({
	kind,
	id,
	tagIds,
	folderId
}: UseReadingPaneTagsArgs): ReadingPaneTagsProps => {
	const [t] = useTranslation();
	const tags = useTagPillItems(tagIds);
	const ids = useMemo(() => [id], [id]);
	const { removeTag, toggleTag } = useTagPillActions({ kind, ids });
	const runSearch = useRunSearchIntegration();
	const userTags = useTags();
	const editable = !isSpam(folderId);

	const onSearch = useCallback(
		(tag: TagPillItem) => {
			// The same chip the search module gets from the other tag searches of Mails.
			const chip = {
				avatarBackground: tag.color,
				avatarIcon: 'Tag',
				background: 'gray2' as const,
				hasAvatar: true,
				isGeneric: false,
				isQueryFilter: true,
				label: `tag:${tag.name}`,
				value: `tag:"${tag.name.replaceAll('"', ESCAPED_QUOTE)}"`
			};
			runSearch?.([chip], 'mails');
		},
		[runSearch]
	);

	const onRemove = useCallback<NonNullable<ReadingPaneTagsProps['onRemove']>>(
		(tag, { onUndo, onError }) =>
			removeTag(tag.name, {
				onUndo,
				onError,
				// Undo puts the tag back where it was, not on every message of the conversation
				undoMessageIds:
					kind === 'conversation'
						? getConversationMessages(id)
								.filter((message) => message.tags?.includes(tag.id))
								.map((message) => message.id)
						: undefined
			}),
		[id, kind, removeTag]
	);

	const removeLabel = useCallback(
		(tag: TagPillItem) =>
			kind === 'conversation'
				? t('label.remove_tag_from_conversation', {
						name: tag.name,
						defaultValue: 'Remove tag {{name}} from conversation'
					})
				: t('label.remove_tag_name', { name: tag.name, defaultValue: 'Remove tag {{name}}' }),
		[kind, t]
	);

	const menu = useMemo<ReadingPaneTagsProps['menu']>(
		() => ({
			allTags: sortTagsByName(Object.values(userTags)).map((tag) => ({
				id: tag.id,
				name: tag.name,
				color: resolveTagColorHex(tag)
			})),
			onToggle: (tag, apply): void => toggleTag(tag.name, apply)
		}),
		[toggleTag, userTags]
	);

	return useMemo(
		() => ({
			tags,
			onSearch,
			onRemove: editable ? onRemove : undefined,
			removeLabel,
			menu: editable ? menu : undefined
		}),
		[editable, menu, onRemove, onSearch, removeLabel, tags]
	);
};
