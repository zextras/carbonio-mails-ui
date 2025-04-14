/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { generateFolder } from '../../../../carbonio-ui-commons/test/mocks/folders/folders-generator';
import { Folder } from '../../../../types';
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
describe('filterFoldersByName performance', () => {
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
