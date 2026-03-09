/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { QueryChip } from '@zextras/carbonio-search-ui';
import { CONTACT_TYPES, ContactInputItem } from '@zextras/carbonio-ui-commons';
import { keyBy } from 'lodash';
import moment from 'moment';

import { createFakeIdentity } from '@test-utils/accounts/fakeAccounts';
import { generateFolder, generateFolderLink } from '@test-utils/folders/folders-generator';
import { Query } from 'views/search/types/types';
import {
	generateQueryString,
	getAdvancedFiltersDefaultValues,
	updateQueryChips,
	getQueryToBe
} from 'views/search/utils';

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

	it('should exclude chips with queryChipsToAdvancedFiltersValue property from query string generation', () => {
		const queryWithAdvancedFilters = [
			{ id: '0-yuliya', value: 'yuliya', label: 'yuliya' },
			{
				id: '1-folder',
				value: 'LOCAL_ROOT',
				label: 'in:Home',
				queryChipsToAdvancedFiltersValue: {
					cascade: { value: true },
					folderId: { value: 'LOCAL_ROOT', label: 'in:Home' }
				}
			},
			{
				id: '2-owner',
				value: '74565421-1f37-4184-b8a5-d9b818d89248',
				label: 'Name Surname',
				queryChipsToAdvancedFiltersValue: {
					ownerId: { value: '74565421-1f37-4184-b8a5-d9b818d89248' }
				}
			},
			{
				id: '3-type',
				value: 'FOLDER',
				label: 'Folder',
				queryChipsToAdvancedFiltersValue: {
					type: { value: 'FOLDER' }
				}
			}
		];

		const isSharedFolderIncluded = false;
		const result = generateQueryString(queryWithAdvancedFilters, isSharedFolderIncluded, folders);

		expect(result).toBe('yuliya');
	});
});

describe('updateQueryChips', () => {
	it('should update query chips when query is not empty and isInvalidQuery is false', () => {
		const query = [{ label: 'has:attachment' }];
		const isInvalidQuery = false;
		const updateQuery = vi.fn();

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
		const updateQuery = vi.fn();

		updateQueryChips(query, isInvalidQuery, updateQuery);

		expect(updateQuery).not.toHaveBeenCalled();
	});

	it('should not update query chips when query is not empty but isInvalidQuery is true', () => {
		const query = [{ label: 'has:attachment' }];
		const isInvalidQuery = true;
		const updateQuery = vi.fn();

		updateQueryChips(query, isInvalidQuery, updateQuery);

		expect(updateQuery).not.toHaveBeenCalled();
	});

	it('should skip processing chips that have isGeneric or isQueryFilter', () => {
		const query = [
			{ label: 'has:attachment', isGeneric: true },
			{ label: 'is:unread', isQueryFilter: true }
		];
		const updateQuery = vi.fn();
		updateQueryChips(query, false, updateQuery);

		expect(updateQuery).not.toHaveBeenCalled();
	});

	it('should not call updateQuery if no chips were modified', () => {
		const mockQuery = [{ label: 'unknown:field' }, { label: 'has:attachment', isGeneric: true }];

		const updateQuery = vi.fn();

		updateQueryChips(mockQuery, false, updateQuery);

		expect(updateQuery).not.toHaveBeenCalled();
	});

	it('should handle from: prefix in updateQueryChips', () => {
		const query = [{ label: 'from:test@example.com' }];
		const isInvalidQuery = false;
		const updateQuery = vi.fn();

		updateQueryChips(query, isInvalidQuery, updateQuery);

		expect(updateQuery).toHaveBeenCalledWith([
			{
				avatarBackground: 'gray1',
				avatarIcon: 'PersonOutline',
				hasAvatar: true,
				isQueryFilter: true,
				label: 'from:test@example.com',
				value: 'from:test@example.com'
			}
		]);
	});

	it('should handle to: prefix in updateQueryChips', () => {
		const query = [{ label: 'to:recipient@example.com' }];
		const isInvalidQuery = false;
		const updateQuery = vi.fn();

		updateQueryChips(query, isInvalidQuery, updateQuery);

		expect(updateQuery).toHaveBeenCalledWith([
			{
				avatarBackground: 'gray1',
				avatarIcon: 'PersonOutline',
				hasAvatar: true,
				isQueryFilter: true,
				label: 'to:recipient@example.com',
				value: 'to:recipient@example.com'
			}
		]);
	});
});

describe('getAdvancedFiltersDefaultValues', () => {
	it('should return default values when query is empty', () => {
		const result = getAdvancedFiltersDefaultValues([], false);
		expect(result).toEqual({
			attachmentType: [],
			emailStatus: [],
			keywordInput: [],
			subjectInput: [],
			hasAttachment: false,
			isFlagged: false,
			isUnread: false,
			sentBefore: null,
			sentAfter: null,
			sizeSmaller: [],
			sizeLarger: [],
			receivedFrom: [],
			sentTo: [],
			tagInput: [],
			folderInput: [],
			isSharedFolderIncluded: false
		});
	});

	it('should detect "is:unread"', () => {
		const query = [{ label: 'is:unread' }] as Query;
		const result = getAdvancedFiltersDefaultValues(query, false);
		expect(result.isUnread).toBe(true);
	});

	it('should detect "is:flagged"', () => {
		const query = [{ label: 'is:flagged' }] as Query;
		const result = getAdvancedFiltersDefaultValues(query, false);
		expect(result.isFlagged).toBe(true);
	});

	it('should detect "has:attachment"', () => {
		const query = [{ label: 'has:attachment' }] as Query;
		const result = getAdvancedFiltersDefaultValues(query, false);
		expect(result.hasAttachment).toBe(true);
	});

	it('should extract sentBefore date', () => {
		const dateStr = '2023-12-01';
		const query = [{ label: `before:${dateStr}` }] as Query;
		const result = getAdvancedFiltersDefaultValues(query, false);
		expect(moment(result.sentBefore).format('YYYY-MM-DD')).toBe(dateStr);
	});

	it('should extract sentAfter date', () => {
		const dateStr = '2023-12-01';
		const query = [{ label: `after:${dateStr}` }] as Query;
		const result = getAdvancedFiltersDefaultValues(query, false);
		expect(moment(result.sentAfter).format('YYYY-MM-DD')).toBe(dateStr);
	});

	it('should extract multiple dates correctly without conflict', () => {
		const beforeStr = '2023-12-01';
		const afterStr = '2023-12-05';
		const dateStr = '2023-12-10';

		const query = [
			{ label: `before:${beforeStr}` },
			{ label: `after:${afterStr}` },
			{ label: `date:${dateStr}` }
		] as Query;

		const result = getAdvancedFiltersDefaultValues(query, false);

		expect(moment(result.sentBefore).format('YYYY-MM-DD')).toBe(beforeStr);
		expect(moment(result.sentAfter).format('YYYY-MM-DD')).toBe(afterStr);
	});

	it('should extract sizeSmaller filter', () => {
		const query = [{ label: 'Smaller:100KB' }] as Query;
		const result = getAdvancedFiltersDefaultValues(query, false);
		expect(result.sizeSmaller).toHaveLength(1);
		expect(result.sizeSmaller[0].label).toBe('Smaller:100KB');
	});

	it('should extract sizeLarger filter', () => {
		const query = [{ label: 'Larger:5MB' }] as Query;
		const result = getAdvancedFiltersDefaultValues(query, false);
		expect(result.sizeLarger).toHaveLength(1);
		expect(result.sizeLarger[0].label).toBe('Larger:5MB');
	});

	it('should extract sentTo email', () => {
		const query = [{ label: 'to:test@example.com', value: 'test@example.com' }] as Query;
		const result = getAdvancedFiltersDefaultValues(query, false);
		expect(result.sentTo).toHaveLength(1);
		expect(result.sentTo[0].value.email).toBe('test@example.com');
	});

	it('should extract receivedFrom email', () => {
		const query = [{ label: 'from:test@example.com', value: 'test@example.com' }] as Query;
		const result = getAdvancedFiltersDefaultValues(query, false);
		expect(result.receivedFrom).toHaveLength(1);
		expect(result.receivedFrom[0].value.email).toBe('test@example.com');
	});

	it('should extract tagInput', () => {
		const query = [{ label: 'tag:Work' }] as Query;
		const result = getAdvancedFiltersDefaultValues(query, false);
		expect(result.tagInput).toHaveLength(1);
		expect(result.tagInput[0].label).toBe('tag:Work');
	});

	it('should add isQueryFilter property to from and to fields', () => {
		const query = [
			{ label: 'from:test@example.com', value: 'test@example.com' },
			{ label: 'to:recipient@example.com', value: 'recipient@example.com' }
		] as Query;

		const formValues = getAdvancedFiltersDefaultValues(query, false);

		formValues.receivedFrom = [
			{
				id: 'test@example.com',
				label: 'test@example.com',
				value: { id: 'test@example.com', email: 'test@example.com', type: CONTACT_TYPES.CONTACT },
				background: 'gray1'
			}
		];
		formValues.sentTo = [
			{
				id: 'recipient@example.com',
				label: 'recipient@example.com',
				value: {
					id: 'recipient@example.com',
					email: 'recipient@example.com',
					type: CONTACT_TYPES.CONTACT
				},
				background: 'gray1'
			}
		];

		const result = getQueryToBe(formValues);

		const fromField = result.find((item) => item.label?.startsWith('from:'));
		expect(fromField).toBeDefined();
		expect(fromField?.isQueryFilter).toBe(true);

		const toField = result.find((item) => item.label?.startsWith('to:'));
		expect(toField).toBeDefined();
		expect(toField?.isQueryFilter).toBe(true);
	});

	it('should extract folderInput', () => {
		const query = [{ label: 'in:Inbox' }] as Query;
		const result = getAdvancedFiltersDefaultValues(query, false);
		expect(result.folderInput).toHaveLength(1);
		expect(result.folderInput[0].label).toBe('in:Inbox');
	});

	it('should extract emailStatus (Is:*)', () => {
		const query = [{ label: 'Is:replied' }] as Query;
		const result = getAdvancedFiltersDefaultValues(query, false);
		expect(result.emailStatus).toHaveLength(1);
		expect(result.emailStatus[0].label).toBe('Is:replied');
	});

	it('should extract attachmentType', () => {
		const query = [{ label: 'Attachment:.pdf' }] as Query;
		const result = getAdvancedFiltersDefaultValues(query, false);
		expect(result.attachmentType).toHaveLength(1);
		expect(result.attachmentType[0].label).toBe('Attachment:.pdf');
	});

	it('should extract subjectInput', () => {
		const query = [{ label: 'Subject:Meeting Reminder' }] as Query;
		const result = getAdvancedFiltersDefaultValues(query, false);
		expect(result.subjectInput).toHaveLength(1);
		expect(result.subjectInput[0].label).toBe('Subject:Meeting Reminder');
	});

	it('should extract keywordInput as fallback for non-matching queries', () => {
		const query = [{ label: 'project alpha' }] as Query;
		const result = getAdvancedFiltersDefaultValues(query, false);
		expect(result.keywordInput).toHaveLength(1);
		expect(result.keywordInput[0].label).toBe('project alpha');
	});

	it('should ignore excluded prefixes in keywordInput', () => {
		const query = [
			{ label: 'has:attachment' },
			{ label: 'Subject:test' },
			{ label: 'in:Inbox' },
			{ label: 'before:2024-01-01' },
			{ label: 'random keyword' }
		] as Query;

		const result = getAdvancedFiltersDefaultValues(query, false);
		expect(result.keywordInput).toHaveLength(1);
		expect(result.keywordInput[0].label).toBe('random keyword');
	});

	it('should set isSharedFolderIncluded flag properly', () => {
		const result = getAdvancedFiltersDefaultValues([], true);
		expect(result.isSharedFolderIncluded).toBe(true);
	});

	it('should exclude chips with queryChipsToAdvancedFiltersValue from keywords', () => {
		const queryWithAdvancedFilters = [
			{ id: '0-yuliya', value: 'yuliya', label: 'yuliya' },
			{
				id: '1-folder',
				value: 'LOCAL_ROOT',
				label: 'in:Home',
				queryChipsToAdvancedFiltersValue: {
					cascade: { value: true },
					folderId: { value: 'LOCAL_ROOT', label: 'in:Home' }
				}
			},
			{
				id: '2-owner',
				value: '74565421-1f37-4184-b8a5-d9b818d89248',
				label: 'Name Surname',
				queryChipsToAdvancedFiltersValue: {
					ownerId: { value: '74565421-1f37-4184-b8a5-d9b818d89248' }
				}
			},
			{
				id: '3-type',
				value: 'FOLDER',
				label: 'Folder',
				queryChipsToAdvancedFiltersValue: {
					type: { value: 'FOLDER' }
				}
			}
		];

		const result = getAdvancedFiltersDefaultValues(queryWithAdvancedFilters, false);

		expect(result.keywordInput).toHaveLength(1);
		expect(result.keywordInput[0].value).toBe('yuliya');
		expect(result.keywordInput[0].label).toBe('yuliya');
	});
});

describe('getQueryToBe', () => {
	const defaultValues = getAdvancedFiltersDefaultValues([], true);
	const contactMail = 'user@companyname.com';
	const contactFilter = [
		{
			id: contactMail,
			label: contactMail,
			value: {
				id: contactMail,
				firstName: 'Firstname',
				lastName: 'Lastname',
				fullName: 'Firstname Lastname',
				company: 'CompanyName',
				email: contactMail,
				type: 'CONTACT' as const,
				originalContactEmail: `"Firstname Lastname" <${contactMail}>`
			},
			error: false,
			actions: []
		}
	];
	const getContactFilterWithPrefix = (prefix: 'from:' | 'to:'): ContactInputItem[] => [
		{
			id: `${prefix}${contactMail}`,
			label: `${prefix}${contactMail}`,
			value: {
				id: `${prefix}${contactMail}`,
				email: `${prefix}${contactMail}`,
				type: 'CONTACT'
			}
		}
	];
	it('should return from: prefix followed by user mail in label and value when from field is valued', () => {
		const queryToBe = getQueryToBe({ ...defaultValues, receivedFrom: contactFilter });

		expect(queryToBe).toEqual([
			expect.objectContaining({
				label: `from:${contactMail}`,
				value: `from:${contactMail}`
			})
		]);
	});

	it('should return to: prefix followed by user mail in label and value when to field is valued', () => {
		const queryToBe = getQueryToBe({ ...defaultValues, sentTo: contactFilter });

		expect(queryToBe).toEqual([
			expect.objectContaining({
				label: `to:${contactMail}`,
				value: `to:${contactMail}`
			})
		]);
	});

	it('should not add from: prefix in from field if already available', () => {
		const queryToBe = getQueryToBe({
			...defaultValues,
			receivedFrom: getContactFilterWithPrefix('from:')
		});

		expect(queryToBe).toEqual([
			expect.objectContaining({
				label: `from:${contactMail}`,
				value: `from:${contactMail}`
			})
		]);
	});

	it('should not add to: prefix in to field if already available', () => {
		const queryToBe = getQueryToBe({
			...defaultValues,
			sentTo: getContactFilterWithPrefix('to:')
		});

		expect(queryToBe).toEqual([
			expect.objectContaining({
				label: `to:${contactMail}`,
				value: `to:${contactMail}`
			})
		]);
	});
});
