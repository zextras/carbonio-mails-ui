/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { reduce } from 'lodash';
import { v4 as uuid } from 'uuid';

import {
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

/**
 * Takes a Folders object and returns an array of folder names (keys)
 * that have the `perm` property set to a truthy value.
 */
export function getFoldersNameArray(folders: Folders): Array<string> {
	return reduce(
		folders,
		(acc: Array<string>, value: Folder, key: string) => {
			if (value.perm) {
				acc.push(key);
			}
			return acc;
		},
		[]
	);
}
