/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { QueryChip } from '@zextras/carbonio-search-ui';
import { concat, filter, includes, map, reduce, replace } from 'lodash';
import moment from 'moment';

import { extractDateFieldFromQuery } from './extract-date-field-from-query';
import { findIconFromChip } from './parts/use-find-icon';
import { ChipType, Folder, Folders } from '../../types';
import { FormValues, KeywordState, Query, SearchQueryItem } from './types/types';
import { CONTACT_TYPES } from '../../carbonio-ui-commons/integrations/constants';
import { ContactInputItem } from '../../carbonio-ui-commons/integrations/types';

function getRegex(prefix?: string): RegExp {
	return new RegExp(`^${prefix}:.*`, 'i');
}

function formatWithPrefix(resultString: string, prefix: string): string {
	const regex = getRegex(prefix);
	return regex.test(resultString) ? resultString : `${prefix}:${resultString}`;
}

export function getChipString(
	{ label, fullName }: { label?: string; fullName?: string },
	prefix: string
): string {
	if (fullName) {
		return formatWithPrefix(fullName, prefix);
	}
	if (label) {
		return formatWithPrefix(label, prefix);
	}
	return '';
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

function getAttachmentTypeDefaultValue(query: Query): KeywordState {
	return filter(query, (v) => /^Attachment:/.test(v.label));
}

function getSubjectInputDefaultValue(query: Query): KeywordState {
	return filter(query, (v) => /^Subject:/.test(v.label));
}

function getOtherKeywordsDefaultValue(query: Query): KeywordState {
	const queryArray = ['has:attachment', 'is:flagged', 'is:unread'];
	return map(
		filter(
			query,
			(v) =>
				!includes(queryArray, v.label) &&
				!/^Subject:/.test(v.label) &&
				!/^Attachment:/.test(v.label) &&
				!/^Is:/.test(v.label) &&
				!/^Smaller:/.test(v.label) &&
				!/^Larger:/.test(v.label) &&
				!/^subject:/.test(v.label) &&
				!/^in:/.test(v.label) &&
				!/^before:/.test(v.label) &&
				!/^after:/.test(v.label) &&
				!/^date:/.test(v.label) &&
				!/^tag:/.test(v.label) &&
				!/^to:/.test(v.label) &&
				!/^from:/.test(v.label) &&
				!v.isQueryFilter
		),
		(q) => ({ ...q, hasAvatar: false })
	);
}

function toContactInput(item: SearchQueryItem): ContactInputItem {
	const email = item.value ?? '';
	return {
		id: email,
		label: email,
		value: {
			id: email,
			email,
			type: CONTACT_TYPES.CONTACT
		}
	};
}

function getSentToDefaultValue(query: Query): Array<ContactInputItem> {
	return query
		.filter((queryItem) => /^to:*/.test(queryItem.label))
		.map((queryItem) => ({ ...queryItem, label: replace(queryItem.label, 'to:', '') }))
		.map((item) => toContactInput(item));
}

function getReceivedFromDefaultValue(query: Query): Array<ContactInputItem> {
	return query
		.filter((queryItem) => /^from:*/.test(queryItem.label))
		.map((queryItem) => ({ ...queryItem, label: replace(queryItem.label, 'from:', '') }))
		.map((item) => toContactInput(item));
}

function getSizeSmallerDefaultValue(
	query: Query
): { id: string; label: string; value?: string; isGeneric?: boolean; isQueryFilter?: boolean }[] {
	return map(
		filter(query, (v) => /^Smaller:/.test(v.label)),
		(q) => ({ ...q, id: '', label: '' })
	);
}

function getSizeLargerDefaultValue(query: Query): SearchQueryItem[] {
	return filter(query, (v) => /^Larger:/.test(v.label));
}

function getTagInQueryDefaultValue(query: Query): KeywordState {
	return map(
		filter(query, (v) => /^tag:/.test(v.label)),
		(q) => ({ ...q, hasAvatar: true, icon: 'TagOutline' })
	);
}

function getFolderInQueryDefaultValue(query: Query): KeywordState {
	return map(
		filter(query, (v) => /^in:/.test(v.label)),
		(q) => ({
			...q,
			hasAvatar: true,
			icon: 'FolderOutline'
		})
	);
}

function getEmailStatusDefaultValue(query: Query): KeywordState {
	return filter(query, (v) => /^Is:/.test(v.label));
}

export function getAdvancedFiltersDefaultValues(
	query: Query,
	isSharedFolderIncluded: boolean
): FormValues {
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
		sentOn: extractDateFieldFromQuery('on', query),
		sizeSmaller: getSizeSmallerDefaultValue(query),
		sizeLarger: getSizeLargerDefaultValue(query),
		receivedFrom: getReceivedFromDefaultValue(query),
		sentTo: getSentToDefaultValue(query),
		tagInput: getTagInQueryDefaultValue(query),
		folderInput: getFolderInQueryDefaultValue(query),
		isSharedFolderIncluded
	};
}
