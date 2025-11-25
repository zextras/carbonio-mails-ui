import moment from 'moment';
import type { Mock } from 'vitest';
/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as utils from 'commons/utils';
import { extractDateFieldFromQuery } from 'views/search/extract-date-field-from-query';
import { Query } from 'views/search/types/types';

// Mock the getUserLocale function
vi.mock('commons/utils', async () => ({
	...(await vi.importActual('commons/utils')),
	getUserLocale: vi.fn()
}));

const mockedGetUserLocale = utils.getUserLocale as Mock<typeof utils.getUserLocale>;

describe('extractDateFieldFromQuery', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		// Reset moment locale to default after each test
		moment.locale('en');
	});

	it('should return null when no matching prefix is found', () => {
		mockedGetUserLocale.mockReturnValue('en');
		const query: Query = [
			{ id: '1', label: 'subject:test' },
			{ id: '2', label: 'from:user@example.com' }
		];

		const result = extractDateFieldFromQuery('before', query);

		expect(result).toBeNull();
	});

	it('should return null when query is empty', () => {
		mockedGetUserLocale.mockReturnValue('en');
		const query: Query = [];

		const result = extractDateFieldFromQuery('after', query);

		expect(result).toBeNull();
	});

	it('should parse date with US locale (MM/DD/YYYY)', () => {
		mockedGetUserLocale.mockReturnValue('en-US');
		const query: Query = [{ id: '1', label: 'before:12/25/2023' }];

		const result = extractDateFieldFromQuery('before', query);

		expect(result).toBeInstanceOf(Date);
		expect(result?.getFullYear()).toBe(2023);
		expect(result?.getMonth()).toBe(11); // December (0-indexed)
		expect(result?.getDate()).toBe(25);
	});

	it('should parse date with European locale (DD/MM/YYYY)', () => {
		mockedGetUserLocale.mockReturnValue('en-GB');
		const query: Query = [{ id: '1', label: 'after:25/12/2023' }];

		const result = extractDateFieldFromQuery('after', query);

		expect(result).toBeInstanceOf(Date);
		expect(result?.getFullYear()).toBe(2023);
		expect(result?.getMonth()).toBe(11); // December (0-indexed)
		expect(result?.getDate()).toBe(25);
	});

	it('should parse date with Italian locale (DD/MM/YYYY)', () => {
		mockedGetUserLocale.mockReturnValue('it-IT');
		const query: Query = [{ id: '1', label: 'before:31/01/2024' }];

		const result = extractDateFieldFromQuery('before', query);

		expect(result).toBeInstanceOf(Date);
		expect(result?.getFullYear()).toBe(2024);
		expect(result?.getMonth()).toBe(0); // January (0-indexed)
		expect(result?.getDate()).toBe(31);
	});

	it('should parse date with German locale (DD.MM.YYYY)', () => {
		mockedGetUserLocale.mockReturnValue('de-DE');
		const query: Query = [{ id: '1', label: 'date:15.03.2024' }];

		const result = extractDateFieldFromQuery('date', query);

		expect(result).toBeInstanceOf(Date);
		expect(result?.getFullYear()).toBe(2024);
		expect(result?.getMonth()).toBe(2); // March (0-indexed)
		expect(result?.getDate()).toBe(15);
	});

	it('should parse date with French locale (DD/MM/YYYY)', () => {
		mockedGetUserLocale.mockReturnValue('fr-FR');
		const query: Query = [{ id: '1', label: 'after:14/07/2024' }];

		const result = extractDateFieldFromQuery('after', query);

		expect(result).toBeInstanceOf(Date);
		expect(result?.getFullYear()).toBe(2024);
		expect(result?.getMonth()).toBe(6); // July (0-indexed)
		expect(result?.getDate()).toBe(14);
	});

	it('should handle ISO date format regardless of locale', () => {
		mockedGetUserLocale.mockReturnValue('it-IT');
		const query: Query = [{ id: '1', label: 'before:2024-03-15' }];

		const result = extractDateFieldFromQuery('before', query);

		expect(result).toBeInstanceOf(Date);
		expect(result?.getFullYear()).toBe(2024);
		expect(result?.getMonth()).toBe(2); // March (0-indexed)
		expect(result?.getDate()).toBe(15);
	});

	it('should handle invalid date gracefully', () => {
		// Mock console.warn to suppress moment deprecation warnings
		const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(vi.fn());

		mockedGetUserLocale.mockReturnValue('en-US');
		const query: Query = [{ id: '1', label: 'before:invalid-date' }];

		const result = extractDateFieldFromQuery('before', query);

		// moment returns Invalid Date for invalid dates, which becomes Invalid Date object
		expect(result).toBeInstanceOf(Date);
		expect(Number.isNaN(result?.getTime())).toBe(true);

		consoleSpy.mockRestore();
	});

	it('should work with case-sensitive prefix matching', () => {
		mockedGetUserLocale.mockReturnValue('en-US');
		const query: Query = [
			{ id: '1', label: 'Before:01/15/2024' }, // Capital B
			{ id: '2', label: 'before:02/20/2024' } // lowercase b
		];

		const result = extractDateFieldFromQuery('before', query);

		// Should only match the lowercase 'before:' prefix
		expect(result?.getMonth()).toBe(1); // February (0-indexed)
	});

	it('should handle edge case with empty date string', () => {
		mockedGetUserLocale.mockReturnValue('en-US');
		const query: Query = [
			{ id: '1', label: 'before:' } // Empty date after colon
		];

		const result = extractDateFieldFromQuery('before', query);

		expect(result).toBeInstanceOf(Date);
		expect(Number.isNaN(result?.getTime())).toBe(true);
	});

	it('should handle multiple date queries and return the first one', () => {
		mockedGetUserLocale.mockReturnValue('en-US');
		const query: Query = [
			{ id: '1', label: 'before:01/15/2024' },
			{ id: '2', label: 'before:02/20/2024' },
			{ id: '3', label: 'subject:test' }
		];

		const result = extractDateFieldFromQuery('before', query);

		expect(result).toBeInstanceOf(Date);
		expect(result?.getFullYear()).toBe(2024);
		expect(result?.getMonth()).toBe(0); // January (0-indexed)
		expect(result?.getDate()).toBe(15);
	});

	it('should use getUserLocale to determine parsing format', () => {
		const mockLocale = 'ja-JP';
		mockedGetUserLocale.mockReturnValue(mockLocale);

		const query: Query = [{ id: '1', label: 'before:2024/03/15' }];

		extractDateFieldFromQuery('before', query);

		expect(mockedGetUserLocale).toHaveBeenCalledTimes(1);
	});
});
