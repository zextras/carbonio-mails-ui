/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { FOLDERS } from '@zextras/carbonio-shell-ui';

import { parseMessageSortingOptions } from '../sorting';

const defaultSortingSettings = {
	sortType: 'date',
	sortDirection: 'Desc' as 'Asc' | 'Desc',
	sortOrder: 'dateDesc',
	remainingFoldersSortOrder: '',
	remainingSortOptions: ''
};

test('parseMessageSortingOptions returns the defaultSortingSettings when the sortOrder is not received', () => {
	const folderId = FOLDERS.INBOX;
	expect(parseMessageSortingOptions(folderId)).toStrictEqual(defaultSortingSettings);
});
describe('parseMessageSortingOptions', () => {
	test('the function should return default sorting options when folderId or zimbraPrefSortOrder is undefined', () => {
		const result = parseMessageSortingOptions();
		expect(result).toStrictEqual(defaultSortingSettings);
	});

	test('the function should return default sorting options when zimbraPrefSortOrder is empty', () => {
		const folderId = FOLDERS.INBOX;
		const result = parseMessageSortingOptions(folderId, '');

		expect(result).toStrictEqual(defaultSortingSettings);
	});

	test('the function should parse sorting options correctly for a valid folderId and zimbraPrefSortOrder', () => {
		const zimbraPrefSortOrder =
			'2:subjAsc,366:dateDesc,5:attachDesc,BDLV:,CAL:,CLV:,CLV-SR-1:dateDesc,CLV-SR-2:dateDesc,CLV-main:dateDesc,CNS:,CNSRC:,CNTGT:,CV:,TKL:,TKL-main:taskDueAsc,TV:,TV-main:dateDesc';
		const result = parseMessageSortingOptions(FOLDERS.INBOX, zimbraPrefSortOrder);

		expect(result).toEqual({
			sortType: 'subj',
			sortDirection: 'Asc',
			sortOrder: 'subjAsc',
			remainingFoldersSortOrder: '366:dateDesc,5:attachDesc',
			remainingSortOptions:
				',BDLV:,CAL:,CLV:,CLV-SR-1:dateDesc,CLV-SR-2:dateDesc,CLV-main:dateDesc,CNS:,CNSRC:,CNTGT:,CV:,TKL:,TKL-main:taskDueAsc,TV:,TV-main:dateDesc'
		});
	});

	test('the function should handle multiple sorting options and folders correctly', () => {
		const zimbraPrefSortOrder =
			'2:subjAsc,366:dateDesc,5:attachDesc,BDLV:,CAL:,CLV:,CLV-SR-1:dateDesc,CLV-SR-2:dateDesc,CLV-main:dateDesc,CNS:,CNSRC:,CNTGT:,CV:,TKL:,TKL-main:taskDueAsc,TV:,TV-main:dateDesc';
		const result = parseMessageSortingOptions(FOLDERS.SENT, zimbraPrefSortOrder);

		expect(result).toEqual({
			sortType: 'attach',
			sortDirection: 'Desc',
			sortOrder: 'attachDesc',
			remainingFoldersSortOrder: '2:subjAsc,366:dateDesc',
			remainingSortOptions:
				',BDLV:,CAL:,CLV:,CLV-SR-1:dateDesc,CLV-SR-2:dateDesc,CLV-main:dateDesc,CNS:,CNSRC:,CNTGT:,CV:,TKL:,TKL-main:taskDueAsc,TV:,TV-main:dateDesc'
		});
	});

	test('the function should handle sorting option for shared account folder correctly', () => {
		const zimbraPrefSortOrder =
			'2:subjAsc,366:dateDesc,5:attachDesc,a79fa996-e90e-4s04-85c4-c84209ab8266:2:readAsc,BDLV:,CAL:,CLV:,CLV-SR-1:dateDesc,CLV-SR-2:dateDesc,CLV-main:dateDesc,CNS:,CNSRC:,CNTGT:,CV:,TKL:,TKL-main:taskDueAsc,TV:,TV-main:dateDesc';
		const result = parseMessageSortingOptions(
			'a79fa996-e90e-4s04-85c4-c84209ab8266:2',
			zimbraPrefSortOrder
		);

		expect(result).toEqual({
			sortType: 'read',
			sortDirection: 'Asc',
			sortOrder: 'readAsc',
			remainingFoldersSortOrder: '2:subjAsc,366:dateDesc,5:attachDesc',
			remainingSortOptions:
				',BDLV:,CAL:,CLV:,CLV-SR-1:dateDesc,CLV-SR-2:dateDesc,CLV-main:dateDesc,CNS:,CNSRC:,CNTGT:,CV:,TKL:,TKL-main:taskDueAsc,TV:,TV-main:dateDesc'
		});
	});

	test('the function should return default sorting option for shared account folder in case not saved', () => {
		const zimbraPrefSortOrder =
			'BDLV:,CAL:,CLV:,CLV-SR-1:dateDesc,CLV-SR-2:dateDesc,CLV-main:dateDesc,CNS:,CNSRC:,CNTGT:,CV:,TKL:,TKL-main:taskDueAsc,TV:,TV-main:dateDesc';
		const result = parseMessageSortingOptions(
			'a79fa996-e90e-4s04-85c4-c84209ab8266:2',
			zimbraPrefSortOrder
		);
		expect(result).toStrictEqual(defaultSortingSettings);
	});
});
