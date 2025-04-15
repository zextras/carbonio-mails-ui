/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { generateFolder } from '../../../../../carbonio-ui-commons/test/mocks/folders/folders-generator';
import { Folder } from '../../../../../types';
import { filterFoldersByName } from '../utils';

function generateFolderFunction(name: string, n: number, depth: number): Folder {
	if (depth >= 3) {
		return generateFolder({ name, children: [] });
	}

	const children = Array.from({ length: n }, (_, i) =>
		generateFolderFunction(`Subfolder ${name}-${i + 1}`, n, depth + 1)
	);

	return generateFolder({ name, children });
}

function generateLargeFolderStructure(n: number): Folder[] {
	return Array.from({ length: n }, (_, i) => generateFolderFunction(`Folder ${i + 1}`, n, 0));
}
describe('filterFoldersByName', () => {
	const largeFolderStructure: Folder[] = generateLargeFolderStructure(27);

	it('should run within acceptable time limits', () => {
		const searchTerm = 'test';

		const startTime = performance.now();

		const result = filterFoldersByName(largeFolderStructure, searchTerm);

		const endTime = performance.now();

		const executionTime = endTime - startTime;

		expect(result).toBeDefined();
		expect(Array.isArray(result)).toBe(true);

		expect(executionTime).toBeLessThan(100);
	});
});

const mockFolders: Folder[] = [
	generateFolder({
		id: 'folder1',
		name: 'folder1',
		children: [
			generateFolder({ id: 'subfolder1', name: 'subfolder1' }),
			generateFolder({ id: 'subfolder2', name: 'subfolder2' }),
			generateFolder({ id: 'subfolder3', name: 'subfolder3' })
		]
	}),
	generateFolder({ id: 'folder2', name: 'folder2' }),
	generateFolder({
		id: 'folder3',
		name: 'folder3',
		children: [generateFolder({ id: 'subfolder1', name: 'subfolder1' })]
	})
];

describe('filterFoldersByName', () => {
	test('returns all folders when search string is empty', () => {
		const result = filterFoldersByName(mockFolders, '');
		expect(result).toEqual(mockFolders);
	});

	test('returns folders with exact name match', () => {
		const result = filterFoldersByName(mockFolders, 'folder1');
		expect(result).toEqual([{ ...mockFolders[0], children: [] }]);
	});

	test('returns folders with partial name match', () => {
		const result = filterFoldersByName(mockFolders, 'fol');
		expect(result).toEqual([
			{ ...mockFolders[0], children: [] },
			{ ...mockFolders[1] },
			{ ...mockFolders[2], children: [] }
		]);
	});

	test('performs case-insensitive matching', () => {
		const result = filterFoldersByName(mockFolders, 'fOldeR1');
		expect(result).toEqual([{ ...mockFolders[0], children: [] }]);
	});

	test('filters nested folders correctly', () => {
		const result = filterFoldersByName(mockFolders, 'subfolder2');
		expect(result).toEqual([
			{
				...mockFolders[0],
				children: [mockFolders[0].children[1]]
			}
		]);
	});

	test('returns empty array when no matches are found', () => {
		const result = filterFoldersByName(mockFolders, 'nonexistent');
		expect(result).toEqual([]);
	});

	test('returns multiple matches at different levels', () => {
		const result = filterFoldersByName(mockFolders, 'subfolder1');
		expect(result).toEqual([
			{
				...mockFolders[0],
				children: [mockFolders[0].children[0]]
			},
			{
				...mockFolders[2],
				children: [mockFolders[2].children[0]]
			}
		]);
	});

	test('handles empty input array', () => {
		const result = filterFoldersByName([], 'inbox');
		expect(result).toEqual([]);
	});
});
