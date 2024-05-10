/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { generateStore } from '../../../tests/generators/store';
import { selectBackupSearchMessagesStore } from '../../backup-search-slice';

describe('store', () => {
	describe('backup search messages slice', () => {
		it('should be initialized correctly', () => {
			const store = generateStore();
			const backupSearchStore = selectBackupSearchMessagesStore(store.getState());
			expect(backupSearchStore).toMatchObject({ messages: {}, status: 'empty' });
		});
	});
});
