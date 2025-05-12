/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { QueryChip } from '@zextras/carbonio-search-ui';
import { concat, includes, map, reduce } from 'lodash';
import moment from 'moment';
import { v4 as uuid } from 'uuid';

import { findIconFromChip } from './parts/use-find-icon';
import { ChipType, ContactInputItem, Folder, Folders } from '../../types';
import { FormValues, KeywordState, Query, SearchQueryItem } from './types/types';

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

function getChipValue(item: SearchQueryItem | ContactInputItem, prefix: string): string {
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

export function getChipItems(chips: Array<ContactInputItem>, prefix: string): KeywordState {
	return chips.map((chip) => ({
		...chip,
		error: false,
		id: chip.id ?? `${uuid()} ${chip.label}`,
		avatarBackground: chip.avatarBackground ?? 'secondary',
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
	return `(${foldersSearchString} OR is:local)`;
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

	function chipToString(c: QueryChip): string {
		const chipString = (c.value ? c.value : c.label) ?? '';
		const thereAreAnySpaces = chipString?.indexOf(' ') >= 0;
		return thereAreAnySpaces ? `"${chipString}"` : `${chipString}`;
	}

	const queryString = query.map((c) => chipToString(c)).join(' ');

	return isSharedFolderIncluded && foldersArray?.length > 0
		? `(${queryString}) ${foldersToSearchInQuery}`
		: `${queryString}`;
}

const QUERY_DATE_FORMAT = 'L';

function dateToKeywordState({
	id,
	prefix,
	date
}: {
	id: string;
	prefix: string;
	date: Date | null;
}): KeywordState {
	if (date === null) {
		return [];
	}
	const value = `${prefix}:${moment(date).format(QUERY_DATE_FORMAT)}`;
	return [
		{
			id,
			hasAvatar: true,
			avatarBackground: 'gray1',
			label: value,
			value,
			isQueryFilter: true,
			avatarIcon: 'CalendarOutline'
		}
	];
}
export function getQueryToBe(formValues: FormValues): Query {
	const id = 'id';
	const {
		keywordInput,
		subjectInput,
		isUnread,
		isFlagged,
		hasAttachment,
		folderInput,
		sentBefore,
		sentAfter,
		sentOn,
		tagInput,
		attachmentType,
		emailStatus,
		sizeLarger,
		sizeSmaller,
		receivedFrom,
		sentTo
	} = formValues;
	return concat(
		keywordInput,
		subjectInput,
		isUnread
			? [
					{
						id: `${id}--is:unread`,
						label: 'is:unread',
						value: 'is:unread',
						isQueryFilter: true,
						avatarIcon: 'EmailOutline',
						avatarBackground: 'gray1'
					}
				]
			: [],
		isFlagged
			? [
					{
						id: `${id}--is:flagged`,
						label: 'is:flagged',
						value: 'is:flagged',
						isQueryFilter: true,
						avatarIcon: 'FlagOutline',
						avatarBackground: 'error'
					}
				]
			: [],
		hasAttachment
			? [
					{
						id: `${id}--has:attachment`,
						label: 'has:attachment',
						value: 'has:attachment',
						isQueryFilter: true,
						avatarIcon: 'AttachOutline',
						avatarBackground: 'gray1'
					}
				]
			: [],
		folderInput,
		dateToKeywordState({ id: `${id}--before`, prefix: 'before', date: sentBefore }),
		dateToKeywordState({ id: `${id}--after`, prefix: 'after', date: sentAfter }),
		dateToKeywordState({ id: `${id}--date`, prefix: 'date', date: sentOn }),
		tagInput,
		attachmentType,
		emailStatus,
		sizeLarger,
		sizeSmaller,
		receivedFrom.map((item) => ({
			...item,
			id: '',
			label: `from:${item.value.email}`,
			value: `from:${item.value.email}`,
			avatarBackground: item.background,
			error: false
		})),
		sentTo.map((item) => ({
			...item,
			label: `to:${item.value.email}`,
			value: `to:${item.value.email}`,
			avatarBackground: item.background,
			error: false,
			id: ''
		}))
	);
}
