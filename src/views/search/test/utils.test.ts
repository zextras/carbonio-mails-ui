/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { faker } from '@faker-js/faker';

import { getChipItems, getChipString } from '../utils';

const name1 = faker.person.firstName();
const name2 = faker.person.firstName();
const surname1 = faker.person.lastName();
const surname2 = faker.person.lastName();
const domain = faker.internet.domainName();
const email1 = `${name1}.${surname1}@${domain}`;
const email2 = `${name2}.${surname2}@${domain}`;
const fullName1 = `${name1} ${surname1}`;
const fullName2 = `${name2} ${surname2}`;

const mockContactInputItem1 = {
	id: `undefined ${email1}`,
	email: email1,
	firstName: name1,
	lastName: surname1,
	fullName: fullName1,
	isGroup: false,
	label: fullName1
};

const mockContactInputItem2 = {
	id: `undefined ${email2}`,
	email: email2,
	firstName: name2,
	lastName: surname2,
	fullName: fullName2,
	isGroup: false,
	label: fullName2
};

const mockSearchQueryItem1 = {
	label: fullName1,
	hasAvatar: false,
	value: fullName1
};

const mockSearchQueryItem2 = {
	label: fullName2,
	hasAvatar: false,
	value: fullName2
};

describe('getChipString function', () => {
	it('should return the label for SearchQueryItem when it matches the regex', () => {
		const prefix = 'to';
		const result = getChipString(mockSearchQueryItem1, prefix);
		const expected = `${prefix}:${mockSearchQueryItem1.label}`;
		expect(result).toBe(expected);
	});

	it('should prefix the label for SearchQueryItem when it does not match the regex', () => {
		const prefix = 'nonMatchingPrefix';
		const result = getChipString(mockSearchQueryItem1, prefix);
		expect(result).toBe(`${prefix}:${mockSearchQueryItem1.label}`);
	});

	it('should return the fullName for ContactInputItem when there is a prefix', () => {
		const prefix = 'from';
		const result = getChipString(mockContactInputItem1, prefix);
		const prefixedMockContactInputItem = `${prefix}:${mockContactInputItem1.fullName}`;
		expect(result).toBe(prefixedMockContactInputItem);
	});

	it('should prefix the fullName for ContactInputItem when it does not match the regex', () => {
		const prefix = 'nonMatchingPrefix';
		const result = getChipString(mockContactInputItem1, prefix);
		expect(result).toBe(`${prefix}:${mockContactInputItem1.fullName}`);
	});

	it('should handle missing label in SearchQueryItem by returning prefixed empty string', () => {
		const item = {};
		const prefix = 'test';
		const result = getChipString(item, prefix);
		expect(result).toBe(`${prefix}:`);
	});

	it('should handle missing fullName in ContactInputItem by returning prefixed empty string', () => {
		const item = {};
		const prefix = 'test';
		const result = getChipString(item, prefix);
		expect(result).toBe(`${prefix}:`);
	});
});

describe('getChipItems function', () => {
	const prefix = 'to';

	const mockPrefixedSearchQueryItem1 = {
		label: `${prefix}:${mockSearchQueryItem1.label}`,
		value: `${prefix}:${mockSearchQueryItem1.label}`
	};
	const mockPrefixedSearchQueryItem2 = {
		label: `${prefix}:${mockSearchQueryItem2.label}`,
		value: `${prefix}:${mockSearchQueryItem2.label}`
	};
	const expectedResult1 = {
		label: mockPrefixedSearchQueryItem1.label,
		value: mockPrefixedSearchQueryItem1.value,
		fullName: mockPrefixedSearchQueryItem1.label,
		id: expect.stringContaining(surname1),
		hasAvatar: true,
		isGeneric: false,
		isQueryFilter: true,
		error: false,
		avatarIcon: 'EmailOutline',
		avatarBackground: 'secondary'
	};
	const expectedResult2 = {
		...expectedResult1,
		label: mockPrefixedSearchQueryItem2.label,
		value: mockPrefixedSearchQueryItem2.value,
		fullName: mockPrefixedSearchQueryItem2.label,
		id: expect.stringContaining(surname2)
	};

	it('should return an empty array when input is an empty array', () => {
		const result = getChipItems([], 'testPrefix');
		expect(result).toEqual([]);
	});

	it('should handle a single SearchQueryItem correctly', () => {
		const result = getChipItems([mockPrefixedSearchQueryItem1], prefix);
		expect(result).toBeInstanceOf(Array);
		expect(result).toHaveLength(1);
		expect(result[0]).toMatchObject(expectedResult1);
	});

	it('should handle an single ContactInputItem objects correctly', () => {
		const result = getChipItems([mockContactInputItem1], prefix);
		expect(result).toBeInstanceOf(Array);
		expect(result).toHaveLength(1);
		expect(result[0]).toMatchObject(expectedResult1);
	});

	it('should handle an array of SearchQueryItem correctly', () => {
		const result = getChipItems(
			[mockPrefixedSearchQueryItem1, mockPrefixedSearchQueryItem2],
			prefix
		);

		expect(result).toBeInstanceOf(Array);
		expect(result).toHaveLength(2);
		expect(result[0]).toMatchObject(expectedResult1);
		expect(result[1]).toMatchObject(expectedResult2);
	});

	it('should handle an array of ContactInputItem correctly', () => {
		const result = getChipItems([mockContactInputItem1, mockContactInputItem2], prefix);
		expect(result).toBeInstanceOf(Array);
		expect(result).toHaveLength(2);
		expect(result[0]).toMatchObject(expectedResult1);
		expect(result[1]).toMatchObject(expectedResult2);
	});
});
