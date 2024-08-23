/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { QueryChip } from '@zextras/carbonio-shell-ui';
import { includes, map, reduce } from 'lodash';
import { v4 as uuid } from 'uuid';

import { findIconFromChip } from './parts/use-find-icon';
import {
	ChipType,
	ContactInputItem,
	Folder,
	Folders,
	KeywordState,
	Query,
	SearchQueryItem
} from '../../types';

function getRegex(prefix?: string): RegExp {
	return new RegExp(`^${prefix}:.*`, 'i');
}

export function getChipString(item: SearchQueryItem | ContactInputItem, prefix: string): string {
	const regex = getRegex(prefix);
	let resultString = '';
	if ((item as SearchQueryItem).label) {
		resultString = (item as SearchQueryItem).label;
	}
	if ((item as ContactInputItem).fullName) {
		resultString = (item as ContactInputItem).fullName ?? '';
	}
	return regex.test(resultString) ? resultString : `${prefix}:${resultString}`;
}

export function getChipValue(item: SearchQueryItem | ContactInputItem, prefix: string): string {
	const regex = getRegex(prefix);
	let resultString = '';
	if ((item as SearchQueryItem).value) {
		resultString = (item as SearchQueryItem).value ?? '';
	}
	if ((item as ContactInputItem).email) {
		resultString = (item as ContactInputItem).email ?? '';
	}
	if ((item as ContactInputItem).fullName) {
		resultString = (item as ContactInputItem).fullName ?? '';
	}
	return regex.test(resultString) ? resultString : `${prefix}:${resultString}`;
}

export function getChipItems(chips: Query | Array<ContactInputItem>, prefix: string): KeywordState {
	return chips.map((chip) => ({
		...chip,
		error: false,
		id: chip.id ?? `${uuid()} ${chip.label}`,
		avatarBackground: (chip as ContactInputItem).avatarBackground ?? 'secondary',
		hasAvatar: true,
		avatarIcon: 'EmailOutline',
		isGeneric: false,
		isQueryFilter: true,
		label: getChipString(chip, prefix),
		fullName: getChipString(chip, prefix),
		value: getChipValue(chip, prefix)
	}));
}

export function updateQueryChips(
	query: Array<QueryChip>,
	isInvalidQuery: boolean,
	// TOFIX: fix type definition in shell-ui
	// eslint-disable-next-line @typescript-eslint/ban-types
	updateQuery: Function
): void {
	const queryArray = ['has:attachment', 'is:flagged', 'is:unread'];

	let _count = 0;
	if (query?.length > 0 && !isInvalidQuery) {
		const modifiedQuery = map(query, (q) => {
			if (
				(includes(queryArray, q.label) ||
					q.label?.startsWith('subject') ||
					q.label?.startsWith('in') ||
					q.label?.startsWith('before') ||
					q.label?.startsWith('after') ||
					q.label?.startsWith('tag') ||
					q.label?.startsWith('date')) &&
				!includes(Object.keys(q), 'isGeneric') &&
				!includes(Object.keys(q), 'isQueryFilter')
			) {
				_count += 1;
				return findIconFromChip(q as ChipType);
			}
			return { ...q };
		});

		if (_count > 0) {
			updateQuery(modifiedQuery);
		}
	}
}

function generateFoldersSearchQuery(foldersArray: string[]): string {
	const foldersSearchString = foldersArray.map((folder) => `inid:"${folder}"`).join(' OR ');
	return `( ${foldersSearchString} OR is:local) `;
}
function generateFoldersArray(folders: { [key: string]: Folder }): string[] {
	return reduce(
		folders,
		(acc: Array<string>, v: Folder, k: string) => {
			if (v.perm) {
				acc.push(k);
			}
			return acc;
		},
		[]
	);
}

export function generateQueryString(
	query: QueryChip[],
	isSharedFolderIncluded: boolean,
	folders: Folders
): string {
	const foldersArray = generateFoldersArray(folders);
	const foldersToSearchInQuery = generateFoldersSearchQuery(foldersArray);
	return isSharedFolderIncluded && foldersArray?.length > 0
		? `(${query.map((c) => (c.value ? c.value : c.label)).join(' ')}) ${foldersToSearchInQuery}`
		: `${query.map((c) => (c.value ? c.value : c.label)).join(' ')}`;
}
