/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { FOLDERS } from '@zextras/carbonio-ui-commons';

import { parseMessageSortingOptions } from '../parseMessageSortingOptions';
import { getFilterQuery } from 'helpers/sorting';
import { SortDirection } from 'types/sorting';

const minimalDefaultSortingSettings = {
	sortType: 'date',
	sortDirection: 'Desc' as SortDirection
};

test('parseMessageSortingOptions returns the defaultSortingSettings when the sortOrder is not received', () => {
	const folderId = FOLDERS.INBOX;
	expect(parseMessageSortingOptions(folderId)).toStrictEqual(minimalDefaultSortingSettings);
});

describe('parseMessageSortingOptions', () => {
	test('the function should return default sorting options when folderId or zimbraPrefSortOrder is undefined', () => {
		const result = parseMessageSortingOptions(FOLDERS.INBOX);
		expect(result).toStrictEqual(minimalDefaultSortingSettings);
	});

	test('the function should return default sorting options when zimbraPrefSortOrder is empty', () => {
		const folderId = FOLDERS.INBOX;
		const result = parseMessageSortingOptions(folderId, '');
		expect(result).toStrictEqual(minimalDefaultSortingSettings);
	});

	test('the function should parse sorting options correctly for a valid folderId and zimbraPrefSortOrder', () => {
		const zimbraPrefSortOrder =
			'2:subjAsc,366:dateDesc,5:attachDesc,BDLV:,CAL:,CLV:,CLV-SR-1:dateDesc,CLV-SR-2:dateDesc,CLV-main:dateDesc,CNS:,CNSRC:,CNTGT:,CV:,TKL:,TKL-main:taskDueAsc,TV:,TV-main:dateDesc';
		const result = parseMessageSortingOptions(FOLDERS.INBOX, zimbraPrefSortOrder);
		expect(result).toEqual(minimalDefaultSortingSettings);
	});

	test('the function should handle multiple sorting options and folders correctly', () => {
		const zimbraPrefSortOrder =
			'2:subjAsc,366:dateDesc,5:attachDesc,BDLV:,CAL:,CLV:,CLV-SR-1:dateDesc,CLV-SR-2:dateDesc,CLV-main:dateDesc,CNS:,CNSRC:,CNTGT:,CV:,TKL:,TKL-main:taskDueAsc,TV:,TV-main:dateDesc';
		const result = parseMessageSortingOptions(FOLDERS.SENT, zimbraPrefSortOrder);
		expect(result).toEqual(minimalDefaultSortingSettings);
	});

	test('the function should handle sorting option for shared account folder correctly', () => {
		const zimbraPrefSortOrder =
			'2:subjAsc,366:dateDesc,5:attachDesc,a79fa996-e90e-4s04-85c4-c84209ab8266:2:readAsc,BDLV:,CAL:,CLV:,CLV-SR-1:dateDesc,CLV-SR-2:dateDesc,CLV-main:dateDesc,CNS:,CNSRC:,CNTGT:,CV:,TKL:,TKL-main:taskDueAsc,TV:,TV-main:dateDesc';
		const result = parseMessageSortingOptions(
			'a79fa996-e90e-4s04-85c4-c84209ab8266:2',
			zimbraPrefSortOrder
		);
		expect(result).toEqual(minimalDefaultSortingSettings);
	});

	test('the function should return default sorting option for shared account folder in case not saved', () => {
		const zimbraPrefSortOrder =
			'BDLV:,CAL:,CLV:,CLV-SR-1:dateDesc,CLV-SR-2:dateDesc,CLV-main:dateDesc,CNS:,CNSRC:,CNTGT:,CV:,TKL:,TKL-main:taskDueAsc,TV:,TV-main:dateDesc';
		const result = parseMessageSortingOptions(
			'a79fa996-e90e-4s04-85c4-c84209ab8266:2',
			zimbraPrefSortOrder
		);
		expect(result).toStrictEqual(minimalDefaultSortingSettings);
	});
});

describe('getFilterQuery', () => {
	const folderId = FOLDERS.INBOX;

	it('should return default query when filter is undefined', () => {
		expect(getFilterQuery(undefined, folderId)).toBe(`inId:"${folderId}"`);
	});

	it('should return unread query for filter "read"', () => {
		expect(getFilterQuery('read', folderId)).toBe(`inId:"${folderId}" is:unread`);
	});

	it('should return priority query for filter "priority"', () => {
		expect(getFilterQuery('priority', folderId)).toBe(`inId:"${folderId}" priority:high`);
	});

	it('should return flagged query for filter "flag"', () => {
		expect(getFilterQuery('flag', folderId)).toBe(`inId:"${folderId}" is:flagged`);
	});

	it('should return attachment query for filter "attach"', () => {
		expect(getFilterQuery('attach', folderId)).toBe(`inId:"${folderId}" has:attachment`);
	});

	it('should return default query for unknown filter', () => {
		expect(getFilterQuery('somethingElse', folderId)).toBe(`inId:"${folderId}"`);
	});
});
