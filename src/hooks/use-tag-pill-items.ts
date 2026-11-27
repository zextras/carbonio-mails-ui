/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useMemo } from 'react';

import {
	FOLDERS,
	type Folders,
	resolveTagColorHex,
	sortTagsByName,
	TagPillItem,
	useFolderStore,
	useTags
} from '@zextras/carbonio-ui-commons';
import { useTranslation } from 'react-i18next';

import { getFolderIdParts, isSpam } from 'helpers/folders';
import { useConversationMessagesParentsKey } from 'store/emails/store';

/** Prefix of a tag known only by name: one set by the owner of a shared folder (see getTagIds). */
const SHARED_TAG_PREFIX = 'nil:';

/** Whether some of the tags were set by the owner of a shared folder. */
export const hasSharedTag = (tagIds: ReadonlyArray<string> | undefined): boolean =>
	(tagIds ?? []).some((id) => id.startsWith(SHARED_TAG_PREFIX));

/**
 * The owners of the shared folders among `folderIds`, each once, joined by a new line. A folder of
 * another account has an id "<zid>:<id>": its owner is on the mounted folder of that account (a link
 * with the same zid), or on the root of that account when the whole account is shared.
 */
const sharedFolderOwnersKey = (folders: Folders, folderIds: ReadonlyArray<string>): string => {
	const zids = new Set(folderIds.map((folderId) => getFolderIdParts(folderId).zid).filter(Boolean));
	if (zids.size === 0) return '';
	const owners = new Set<string>();
	Object.values(folders).forEach((folder) => {
		const parts = getFolderIdParts(folder.id);
		const zid =
			'zid' in folder && folder.zid ? folder.zid : parts.id === FOLDERS.USER_ROOT && parts.zid;
		if (zid && zids.has(zid) && 'owner' in folder && folder.owner) owners.add(folder.owner);
	});
	return [...owners].join('\n');
};

/**
 * The owners of the shared folders among `folderIds`. A string from the store, so a row re-renders only
 * when they change, and no work at all for an item without tags from a shared folder.
 */
const useSharedFolderOwners = (
	folderIds: ReadonlyArray<string> | undefined,
	enabled: boolean
): Array<string> => {
	const key = useFolderStore((state) =>
		enabled && folderIds?.length ? sharedFolderOwnersKey(state.folders, folderIds) : ''
	);
	return useMemo(() => (key ? key.split('\n') : []), [key]);
};

/**
 * The folders of the messages of a conversation, each once, followed as they change (a message moved
 * elsewhere). Only when `enabled` (the conversation has tags from a shared folder): otherwise none.
 */
export const useConversationFolderIds = (
	conversationId: string,
	enabled: boolean
): Array<string> => {
	const key = useConversationMessagesParentsKey(enabled ? conversationId : '');
	return useMemo(() => (key ? key.split('\n') : []), [key]);
};

const NO_FOLDERS: Array<string> = [];

/**
 * For the tags of a conversation in search results, which come from many folders, with one
 * subscription and only when it has tags: the folders of its messages when a tag comes from a shared
 * folder (as `useConversationFolderIds`), and the Spam folder when any of its messages is there.
 */
export const useConversationTagFolders = (
	conversationId: string,
	tagIds: ReadonlyArray<string> | undefined
): { folderIds: Array<string>; spamFolderId: string | undefined } => {
	const key = useConversationMessagesParentsKey(tagIds?.length ? conversationId : '');
	const shared = hasSharedTag(tagIds);
	return useMemo(() => {
		const all = key ? key.split('\n') : NO_FOLDERS;
		return { folderIds: shared ? all : NO_FOLDERS, spamFolderId: all.find(isSpam) };
	}, [key, shared]);
};

/**
 * The tags of a message or conversation as pills: the user's tags in alphabetical order with their
 * colour, then the tags set by the owner of a shared folder, with whose folder they come from.
 * `folderIds`: the folders of the message, or of the messages of the conversation.
 */
export const useTagPillItems = (
	tagIds: ReadonlyArray<string> | undefined,
	folderIds?: ReadonlyArray<string>
): Array<TagPillItem> => {
	const [t] = useTranslation();
	const tags = useTags();
	const owners = useSharedFolderOwners(folderIds, hasSharedTag(tagIds));
	return useMemo(() => {
		// The name first, as a pill cut short or shown as an icon would hide it, then whose folder: one
		// owner by name; folders of different owners, or none known, only that it is shared.
		const sharedTooltip = (name: string): string =>
			owners.length === 1
				? t('label.tag_from_owner_folder', {
						name,
						owner: owners[0],
						defaultValue: "{{name}} (from {{owner}}'s folder)"
					})
				: t('label.tag_from_shared_folder', {
						name,
						defaultValue: '{{name}} (from a shared folder)'
					});
		const own: Array<TagPillItem> = [];
		const shared: Array<TagPillItem> = [];
		new Set(tagIds ?? []).forEach((id) => {
			if (id.startsWith(SHARED_TAG_PREFIX)) {
				const name = id.slice(SHARED_TAG_PREFIX.length);
				shared.push({ id, name, shared: true, tooltip: sharedTooltip(name) });
				return;
			}
			const tag = tags[id];
			if (tag) {
				own.push({ id, name: tag.name, color: resolveTagColorHex(tag) });
			}
		});
		return [...sortTagsByName(own), ...sortTagsByName(shared)];
	}, [owners, t, tagIds, tags]);
};
