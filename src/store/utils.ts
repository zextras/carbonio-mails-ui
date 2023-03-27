/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { filter, find, includes, isNil, map, max, merge, omitBy, reduce, some } from 'lodash';
import {
	Conversation,
	FetchConversationsReturn,
	FoldersStateType,
	FolderType,
	MailMessage,
	MailsFolderMap
} from '../types';

export function findDepth(subFolder: FolderType, depth = 1): number {
	if (subFolder && subFolder.items && subFolder.items.length) {
		return <number>max(map(subFolder.items, (item) => findDepth(item, depth + 1)));
	}
	return depth;
}

export function calcFolderItems(
	folders: MailsFolderMap,
	subFolders: FolderType | undefined,
	id: string
): FolderType[] {
	return map(
		filter(folders, (item: FolderType) => item.parent === id),
		(item) => ({
			...item,
			items: calcFolderItems(folders, subFolders, item.id),
			to: `/folder/${item.id}`
		})
	);
}

export function calcFolderAbsParentLevelAndPath(
	folders: MailsFolderMap,
	subFolder: FolderType | undefined,
	path = subFolder && subFolder.name,
	level = 1
): { absParent: string; level: number; path: string | undefined } | undefined {
	if (!subFolder) return undefined;
	const nextFolder = find(folders, (item) => item.id === subFolder.parent);
	const nextPath = `${nextFolder ? nextFolder.name : ''}/${path}`;
	return (
		calcFolderAbsParentLevelAndPath(folders, nextFolder, nextPath, level + 1) || {
			absParent: level > 1 ? subFolder.id : subFolder.parent,
			level,
			path
		}
	);
}

// replaced lodash "reduce" method with vanilla JS in order to decrease iterations and improve performance
export function updateFolders(state: FoldersStateType, folders: FolderType[]): void {
	state.folders = Object.values(state.folders).reduce((acc, item) => {
		const newFolder = omitBy(
			Object.values(folders).find((c) => c.id === item.id),
			isNil
		);
		const toRet = newFolder ? { ...item, ...newFolder } : item;

		return {
			...acc,
			[toRet.id]: {
				...toRet
			}
		};
	}, {});
}

export function updateFolderInStore(state: FoldersStateType, folders: FolderType[]): void {
	state.folders = reduce(
		state.folders,
		(acc, item) => {
			const toRet = find(folders, (c) => c.id === item.id) || item;

			const items = calcFolderItems(state.folders, toRet, toRet.id);
			const moreParams = calcFolderAbsParentLevelAndPath(state.folders, toRet);
			return {
				...acc,
				[toRet.id]: {
					...toRet,
					...moreParams,
					depth: findDepth({ ...toRet, items }),
					items,
					path: moreParams ? `/${moreParams.path}` : undefined
				}
			};
		},
		{}
	);
}

export function updatePartialFolderInStore(state: FoldersStateType, folders: FolderType[]): void {
	state.folders = reduce(
		state.folders,
		(acc, item) => {
			const itemToUpdate = find(folders, (c) => c.id === item.id);
			const toRet = merge(item, itemToUpdate ?? {});

			const items = calcFolderItems(state.folders, toRet, toRet.id);
			const moreParams = calcFolderAbsParentLevelAndPath(state.folders, toRet);
			return {
				...acc,
				[toRet.id]: {
					...toRet,
					...moreParams,
					depth: findDepth({ ...toRet, items }),
					items,
					path: moreParams ? `/${moreParams.path}` : undefined
				}
			};
		},
		{}
	);
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function addFoldersToStore(state: FoldersStateType, folders: any): void {
	state.folders = reduce(folders, (acc, v, k) => ({ ...acc, [v.id]: v }), state.folders);
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function removeFoldersFromStore(state: FoldersStateType, idsToDelete: any): void {
	// state.folders = omit(state.folders, idsToDelete); Maybe?
	state.folders = reduce(
		state.folders,
		(acc, v, k) => {
			const value = some(idsToDelete, (cid) => cid === v.id);
			return value ? { ...acc } : { ...acc, [v.id]: v };
		},
		{} as MailsFolderMap
	);
}

/**
 * Extracts all ids from conversations and messages
 * @param items conversations or messages
 * @returns array of ids
 */
export function extractIdsFromMessagesAndConversations(
	items: Record<string, Conversation> | Record<string, MailMessage> | undefined
): Array<string> {
	return Object.keys(items ?? []).reduce((acc: Array<string>, itemId) => {
		const item = items?.[itemId];
		item && acc.push(itemId);
		if (item && 'messages' in item) {
			acc.push(...item.messages.map((msg) => msg.id));
		}
		return acc;
	}, []);
}

/**
 * Extracts all ids from conversations and messages from fetchConversations payload
 * @param payload payload from fetchConversations
 * @returns array of ids
 */
export function extractIds(payload: FetchConversationsReturn | undefined): Array<string> {
	const ids = extractIdsFromMessagesAndConversations(payload?.conversations);
	ids.push(...extractIdsFromMessagesAndConversations(payload?.messages));
	return ids;
}

/**
 * Checks if all items are in search results ids
 * @param ids ids to check
 * @param searchResultsIds ids alread present in search results
 * @returns boolean
 */
export const isItemInSearches = ({
	ids,
	searchResultsIds
}: {
	ids: Array<string>;
	searchResultsIds: Array<string>;
}): boolean =>
	!includes(
		map(ids, (id) => searchResultsIds.includes(id)),
		false
	);
