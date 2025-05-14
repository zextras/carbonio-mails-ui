/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { QueryChip } from '@zextras/carbonio-search-ui';
import { keyBy } from 'lodash';

import { createFakeIdentity } from '../../../carbonio-ui-commons/test/mocks/accounts/fakeAccounts';
import {
	generateFolder,
	generateFolderLink
} from '../../../carbonio-ui-commons/test/mocks/folders/folders-generator';
import { generateQueryString, updateQueryChips } from '../utils';

describe('generateQueryString', () => {
	const query = [
		{ value: 'value1', label: 'label1' },
		{ value: '', label: 'label2' },
		{ value: 'one two three', label: 'label3' }
	];
	const folder = generateFolder({ id: '1' });
	const identity = createFakeIdentity();
	const folderLink = generateFolderLink('100', '101', identity);
	const folders = keyBy([folder, folderLink], 'id');

	it('should generate query string with folders when isSharedFolderIncluded is true and foldersArray has elements', () => {
		const isSharedFolderIncluded = true;
		const result = generateQueryString(query, isSharedFolderIncluded, folders);

		expect(result).toBe('(value1 label2 "one two three") (inid:"101" OR is:local)');
	});

	it('should generate query string without folders when isSharedFolderIncluded is false', () => {
		const isSharedFolderIncluded = false;

		const result = generateQueryString(query, isSharedFolderIncluded, folders);

		expect(result).toBe('value1 label2 "one two three"');
	});

	it('should generate query string without folders when isSharedFolderIncluded is true but foldersArray is empty', () => {
		const isSharedFolderIncluded = true;

		const result = generateQueryString(query, isSharedFolderIncluded, {});

		expect(result).toBe('value1 label2 "one two three"');
	});
});

describe('updateQueryChips', () => {
	it('should update query chips when query is not empty and isInvalidQuery is false', () => {
		const query = [{ label: 'has:attachment' }];
		const isInvalidQuery = false;
		const updateQuery = jest.fn();

		updateQueryChips(query, isInvalidQuery, updateQuery);

		expect(updateQuery).toHaveBeenCalledWith([
			{
				avatarBackground: 'gray1',
				avatarIcon: 'AttachOutline',
				hasAvatar: true,
				isQueryFilter: true,
				label: 'has:attachment',
				value: 'has:attachment'
			}
		]);
	});

	it('should not update query chips when query is empty', () => {
		const query = [] as Array<QueryChip>;
		const isInvalidQuery = false;
		const updateQuery = jest.fn();

		updateQueryChips(query, isInvalidQuery, updateQuery);

		expect(updateQuery).not.toHaveBeenCalled();
	});

	it('should not update query chips when query is not empty but isInvalidQuery is true', () => {
		const query = [{ label: 'has:attachment' }];
		const isInvalidQuery = true;
		const updateQuery = jest.fn();

		updateQueryChips(query, isInvalidQuery, updateQuery);

		expect(updateQuery).not.toHaveBeenCalled();
	});

	it('should skip processing chips that have isGeneric or isQueryFilter', () => {
		const query = [
			{ label: 'has:attachment', isGeneric: true },
			{ label: 'is:unread', isQueryFilter: true }
		];
		const updateQuery = jest.fn();
		updateQueryChips(query, false, updateQuery);

		expect(updateQuery).not.toHaveBeenCalled();
	});

	it('should not call updateQuery if no chips were modified', () => {
		const mockQuery = [{ label: 'unknown:field' }, { label: 'has:attachment', isGeneric: true }];

		const updateQuery = jest.fn();

		updateQueryChips(mockQuery, false, updateQuery);

		expect(updateQuery).not.toHaveBeenCalled();
	});
});
