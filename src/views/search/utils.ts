/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { QueryChip } from '@zextras/carbonio-search-ui';
import {
	CONTACT_TYPES,
	ContactInputItem,
	convertSearchChipToString,
	Folder,
	Folders
} from '@zextras/carbonio-ui-commons';
import { concat, filter, map, reduce } from 'lodash';
import moment from 'moment';

import { ChipType } from 'types/search';
import { extractDateFieldFromQuery } from 'views/search/extract-date-field-from-query';
import { findIconFromChip } from 'views/search/parts/use-find-icon';
import {
	AdvancedFilterModalFormValues,
	KeywordState,
	Query,
	SearchQueryItem
} from 'views/search/types/types';

const excludeLabels = ['has:attachment', 'is:flagged', 'is:unread'];

const excludePrefixes = [
	'Subject:',
	'Attachment:',
	'Is:',
	'Smaller:',
	'Larger:',
	'subject:',
	'in:',
	'before:',
	'after:',
	'date:',
	'tag:',
	'to:',
	'from:'
];
export function updateQueryChips(
	query: Array<QueryChip>,
	isInvalidQuery: boolean,
	// disabling type check until the proper types is defined in shell
	// eslint-disable-next-line @typescript-eslint/ban-types
	updateQuery: Function
): void {
	if (!Array.isArray(query) || query.length === 0 || isInvalidQuery) return;

	const queryArray = ['has:attachment', 'is:flagged', 'is:unread'];

	const isTargetChip = (q: QueryChip): boolean =>
		!!q.label &&
		(queryArray.includes(q.label) ||
			q.label?.startsWith('subject') ||
			q.label?.startsWith('in') ||
			q.label?.startsWith('before') ||
			q.label?.startsWith('after') ||
			q.label?.startsWith('tag') ||
			q.label?.startsWith('date') ||
			q.label?.startsWith('from') ||
			q.label?.startsWith('to')) &&
		!('isGeneric' in q) &&
		!('isQueryFilter' in q);

	const { modifiedQuery, hasChanged } = query.reduce<{
		modifiedQuery: Array<QueryChip>;
		hasChanged: boolean;
	}>(
		(acc, q) => {
			if (isTargetChip(q)) {
				return {
					modifiedQuery: acc.modifiedQuery.concat(findIconFromChip(q as ChipType) as QueryChip),
					hasChanged: true
				};
			}
			return { ...acc, modifiedQuery: acc.modifiedQuery.concat(q) };
		},
		{ modifiedQuery: [], hasChanged: false }
	);

	if (hasChanged) {
		updateQuery(modifiedQuery);
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

	const filteredQuery = query.filter((c) => !('queryChipsToAdvancedFiltersValue' in c));
	const queryString = filteredQuery.map((c) => convertSearchChipToString(c)).join(' ');

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
export function getQueryToBe(formValues: AdvancedFilterModalFormValues): Query {
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
		tagInput,
		attachmentType,
		emailStatus,
		sizeLarger,
		sizeSmaller,
		receivedFrom.map((item) => ({
			...item,
			id: item.value.email,
			label: item.value.email.startsWith('from:') ? item.value.email : `from:${item.value.email}`,
			actions: [],
			value: item.value.email.startsWith('from:') ? item.value.email : `from:${item.value.email}`,
			avatarBackground: item.background,
			error: false,
			isQueryFilter: true
		})),
		sentTo.map((item) => ({
			...item,
			id: item.value.email,
			label: item.value.email.startsWith('to:') ? item.value.email : `to:${item.value.email}`,
			value: item.value.email.startsWith('to:') ? item.value.email : `to:${item.value.email}`,
			actions: [],
			avatarBackground: item.background,
			error: false,
			isQueryFilter: true
		}))
	);
}

function getAttachmentTypeDefaultValue(query: Query): KeywordState {
	return filter(query, (queryItem) => queryItem.label.startsWith('Attachment:'));
}

function getSubjectInputDefaultValue(query: Query): KeywordState {
	return filter(query, (queryItem) => queryItem.label.startsWith('Subject:'));
}

function getOtherKeywordsDefaultValue(query: Query): KeywordState {
	return map(
		filter(query, (queryItem) => {
			const isExcluded =
				excludeLabels.includes(queryItem.label) ||
				excludePrefixes.some((prefix) => queryItem.label.startsWith(prefix)) ||
				queryItem.isQueryFilter ||
				'queryChipsToAdvancedFiltersValue' in queryItem;

			return !isExcluded;
		}),
		(q) => ({ ...q, hasAvatar: false })
	);
}

function toContactInput(item: SearchQueryItem, prefix: 'to:' | 'from:'): ContactInputItem {
	const email = item.value ?? '';
	return {
		id: email,
		label: item.label.startsWith(prefix) ? item.label : `${prefix}${item.label}`,
		value: {
			id: email,
			email,
			type: CONTACT_TYPES.CONTACT
		}
	};
}

function getSentToDefaultValue(query: Query): Array<ContactInputItem> {
	return query
		.filter((queryItem) => queryItem.label.startsWith('to:'))
		.map((item) => toContactInput(item, 'to:'));
}

function getReceivedFromDefaultValue(query: Query): Array<ContactInputItem> {
	return query
		.filter((queryItem) => queryItem.label.startsWith('from:'))
		.map((item) => toContactInput(item, 'from:'));
}

function getSizeSmallerDefaultValue(query: Query): Array<SearchQueryItem> {
	return query.filter((v) => v.label.startsWith('Smaller:'));
}

function getSizeLargerDefaultValue(query: Query): Array<SearchQueryItem> {
	return query.filter((v) => v.label.startsWith('Larger:'));
}

function getTagInQueryDefaultValue(query: Query): KeywordState {
	return query
		.filter((v) => v.label.startsWith('tag:'))
		.map((q) => ({ ...q, hasAvatar: true, icon: 'TagOutline' }));
}

function getFolderInQueryDefaultValue(query: Query): KeywordState {
	return map(
		filter(query, (v) => v.label.startsWith('in:')),
		(q) => ({
			...q,
			hasAvatar: true,
			icon: 'FolderOutline'
		})
	);
}

function getEmailStatusDefaultValue(query: Query): KeywordState {
	return filter(query, (v) => v.label.startsWith('Is:'));
}

export function getAdvancedFiltersDefaultValues(
	query: Query,
	isSharedFolderIncluded: boolean
): AdvancedFilterModalFormValues {
	return {
		attachmentType: getAttachmentTypeDefaultValue(query),
		emailStatus: getEmailStatusDefaultValue(query),
		keywordInput: getOtherKeywordsDefaultValue(query),
		subjectInput: getSubjectInputDefaultValue(query),
		hasAttachment: query.some((item) => item.label === 'has:attachment'),
		isFlagged: query.some((item) => item.label === 'is:flagged'),
		isUnread: query.some((item) => item.label === 'is:unread'),
		sentBefore: extractDateFieldFromQuery('before', query),
		sentAfter: extractDateFieldFromQuery('after', query),
		sizeSmaller: getSizeSmallerDefaultValue(query),
		sizeLarger: getSizeLargerDefaultValue(query),
		receivedFrom: getReceivedFromDefaultValue(query),
		sentTo: getSentToDefaultValue(query),
		tagInput: getTagInQueryDefaultValue(query),
		folderInput: getFolderInQueryDefaultValue(query),
		isSharedFolderIncluded
	};
}
