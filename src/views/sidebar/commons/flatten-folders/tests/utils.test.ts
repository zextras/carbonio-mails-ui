/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Folder } from '@zextras/carbonio-ui-commons';

import { generateFolder } from '@test-utils/folders/folders-generator';
import { flattenAndFilterFoldersWithCap } from 'views/sidebar/commons/flatten-folders/utils';

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

const folder1 = generateFolder({ name: 'folder1' });
const folder2 = generateFolder({ name: 'folder2' });
const folder3 = generateFolder({ name: 'folder3' });
const mockFolders: Folder[] = [
	generateFolder({
		name: 'inbox',
		children: [folder1, folder2, folder3]
	}),
	generateFolder({
		name: 'sent',
		children: [folder1]
	})
];

describe('flattenAndFilterFoldersWithCap', () => {
	const largeFolderStructure: Folder[] = generateLargeFolderStructure(10);

	it('should run within acceptable time limits', () => {
		const searchTerm = 'test';
		const startTime = performance.now();
		const result = flattenAndFilterFoldersWithCap(largeFolderStructure, searchTerm, 100);
		const endTime = performance.now();
		const executionTime = endTime - startTime;

		expect(result).toBeDefined();
		expect(Array.isArray(result)).toBe(true);

		expect(executionTime).toBeLessThan(100);
	});

	it('returns folders with exact name match', () => {
		const result = flattenAndFilterFoldersWithCap(mockFolders, 'sent', 100);
		expect(result).toEqual([{ ...mockFolders[1], children: [] }]);
	});

	it('returns folders with partial name match', () => {
		const result = flattenAndFilterFoldersWithCap(mockFolders, 'old', 100);
		expect(result).toEqual([folder1, folder2, folder3, folder1]);
	});

	it('performs case-insensitive matching', () => {
		const result = flattenAndFilterFoldersWithCap(mockFolders, 'fOldeR1', 100);
		expect(result).toEqual([folder1, folder1]);
	});

	it('returns empty array when no matches are found', () => {
		const result = flattenAndFilterFoldersWithCap(mockFolders, 'nonexistent', 100);
		expect(result).toEqual([]);
	});
	it('limits the number of returned results according to the limit', () => {
		const result = flattenAndFilterFoldersWithCap(mockFolders, 'fol', 2);
		expect(result.length).toBe(2);
	});
	it('does not mutate original folder structure', () => {
		const deepCopy = JSON.parse(JSON.stringify(mockFolders));
		flattenAndFilterFoldersWithCap(mockFolders, 'sub', 10);
		expect(mockFolders).toEqual(deepCopy);
	});

	it('returns full results if limit is greater than matches', () => {
		const result = flattenAndFilterFoldersWithCap(mockFolders, 'fol', 100);
		expect(result.length).toBe(4);
	});
});
