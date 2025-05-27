/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { faker } from '@faker-js/faker';

import { FolderView } from '../../../types/folder';

type RandomInRange = { min?: number; max?: number };

export const getRandomInRange = ({ min = 1, max = 3 }: RandomInRange = {}): number =>
	faker.number.int({ max, min });

export const getRandomFolderFlags = (view?: FolderView): string => {
	const hasFlags = faker.datatype.boolean();
	if (hasFlags) {
		const flags = ['~', 'o', 'y', 'i', '*', 'b'];
		if (view === 'appointment') {
			// adding 'checked' flag only for appointment view
			flags.push('#');
		}
		const index = getRandomInRange({ min: 0, max: flags.length - 1 });
		return flags[index];
	}
	return '';
};
