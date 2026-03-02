/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { FOLDERS } from '@zextras/carbonio-ui-commons';
import { describe, it } from 'vitest';

import { modifySettingString } from '../sorting';

describe('modifySettingString', () => {
	describe('Delete behavior', () => {
		it('should remove a personal folder entry', () => {
			const input = '10:subject-Asc,20:size-Asc,BDLV';
			const prefToUpdate = '10:date-Desc';
			const folderId = '10';

			const result = modifySettingString(input, prefToUpdate, folderId);

			expect(result).toBe('20:size-Asc,BDLV');
		});

		it('should remove a shared folder entry (uuid:folderId)', () => {
			const input = '10:subject-Asc,uuid1:10:subject-Asc,20:size-Asc,BDLV';
			const prefToUpdate = 'uuid1:10:date-Desc';
			const folderId = 'uuid1:10';

			const result = modifySettingString(input, prefToUpdate, folderId);

			expect(result).toBe('10:subject-Asc,20:size-Asc,BDLV');
		});

		it('should NOT remove partial match (10 should not remove 100)', () => {
			const input = '100:subject-Asc,10:size-Asc,BDLV';
			const prefToUpdate = '10:date-Desc';
			const folderId = '10';

			const result = modifySettingString(input, prefToUpdate, folderId);

			expect(result).toBe('100:subject-Asc,BDLV');
		});

		it('should return empty string if all entries removed', () => {
			const input = '10:subject-Asc,BDLV';
			const prefToUpdate = '10:date-Desc';
			const folderId = '10';

			const result = modifySettingString(input, prefToUpdate, folderId);

			expect(result).toBe('');
		});
	});
	describe('Insert behavior', () => {
		it('should prepend prefToUpdate when folder not found', () => {
			const input = '20:size-Asc,BDLV';
			const prefToUpdate = '10:subject-Asc';
			const folderId = '10';

			const result = modifySettingString(input, prefToUpdate, folderId);

			expect(result).toBe('10:subject-Asc,20:size-Asc,BDLV');
		});

		it('should prepend shared folder when not found', () => {
			const input = '10:subject-Asc,BDLV';
			const prefToUpdate = 'uuid1:10:size-Asc';
			const folderId = 'uuid1:10';

			const result = modifySettingString(input, prefToUpdate, folderId);

			expect(result).toBe('uuid1:10:size-Asc,10:subject-Asc,BDLV');
		});
	});
	describe('Update behavior', () => {
		it('should update personal folder entry', () => {
			const input = '10:subject-Asc,20:size-Asc,BDLV';
			const prefToUpdate = '10:date-Asc';
			const folderId = '10';

			const result = modifySettingString(input, prefToUpdate, folderId);

			expect(result).toBe('10:date-Asc,20:size-Asc,BDLV');
		});

		it('should update shared folder entry', () => {
			const input = 'uuid1:10:subject-Asc,20:size-Asc,BDLV';
			const prefToUpdate = 'uuid1:10:date-Asc';
			const folderId = 'uuid1:10';

			const result = modifySettingString(input, prefToUpdate, folderId);

			expect(result).toBe('uuid1:10:date-Asc,20:size-Asc,BDLV');
		});

		it('should preserve order of other elements', () => {
			const input = '1:date-Asc,2:subject-Asc,3:size-Asc,BDLV';
			const prefToUpdate = '2:size-Desc';
			const folderId = '2';

			const result = modifySettingString(input, prefToUpdate, folderId);

			expect(result).toBe('1:date-Asc,2:size-Desc,3:size-Asc,BDLV');
		});

		it('should update first element correctly', () => {
			const input = '1:date-Asc,2:subject-Asc,BDLV';
			const prefToUpdate = '1:size-Asc';
			const folderId = '1';

			const result = modifySettingString(input, prefToUpdate, folderId);

			expect(result).toBe('1:size-Asc,2:subject-Asc,BDLV');
		});

		it('should update last element correctly', () => {
			const input = '1:date-Asc,2:subject-Asc,BDLV';
			const prefToUpdate = '2:size-Asc';
			const folderId = '2';

			const result = modifySettingString(input, prefToUpdate, folderId);

			expect(result).toBe('1:date-Asc,2:size-Asc,BDLV');
		});
	});
	describe('Edge cases', () => {
		it('should handle items without filterOption', () => {
			const input = '10:date-Asc,BDLV';
			const prefToUpdate = '10:subject-Desc-important';
			const folderId = '10';

			const result = modifySettingString(input, prefToUpdate, folderId);

			expect(result).toBe('10:subject-Desc-important,BDLV');
		});

		it('should handle items with filterOption', () => {
			const input = '10:date-Asc-unread,BDLV';
			const prefToUpdate = '10:subject-Desc-important';
			const folderId = '10';

			const result = modifySettingString(input, prefToUpdate, folderId);

			expect(result).toBe('10:subject-Desc-important,BDLV');
		});
		it('should replace an entry that has a filterOption with one without filterOption', () => {
			const zimbraPrefSortOrder = '10:date-Asc-unread,20:size-Asc,BDLV';
			const prefToUpdate = '10:date-Asc';
			const folderId = '10';

			const result = modifySettingString(zimbraPrefSortOrder, prefToUpdate, folderId);

			expect(result).toBe('10:date-Asc,20:size-Asc,BDLV');
		});
	});
});

describe('modifySettingString - trash folder behavior', () => {
	const trashFolderId = FOLDERS.TRASH;

	it('should NOT remove trash folder entry when updating to date-Desc (date-Desc is not the trash default)', () => {
		const input = `${trashFolderId}:date-Asc,20:size-Asc,BDLV`;
		const prefToUpdate = `${trashFolderId}:date-Desc`;

		const result = modifySettingString(input, prefToUpdate, trashFolderId);

		expect(result).toBe(`${trashFolderId}:date-Desc,20:size-Asc,BDLV`);
	});

	it('should remove trash folder entry when updating to changeDate-Desc (changeDate-Desc is the trash default)', () => {
		const input = `${trashFolderId}:date-Asc,20:size-Asc,BDLV`;
		const prefToUpdate = `${trashFolderId}:changeDate-Desc`;

		const result = modifySettingString(input, prefToUpdate, trashFolderId);

		expect(result).toBe('20:size-Asc,BDLV');
	});

	it('should insert trash folder entry for date-Asc when not already present', () => {
		const input = '20:size-Asc,BDLV';
		const prefToUpdate = `${trashFolderId}:date-Asc`;

		const result = modifySettingString(input, prefToUpdate, trashFolderId);

		expect(result).toBe(`${trashFolderId}:date-Asc,20:size-Asc,BDLV`);
	});

	it('should preserve date-Desc in trash folder when toggling direction back to Desc after having selected date sort', () => {
		// User selected 'date' (non-default) in trash, then toggled back to Desc
		// Previously this was a bug: date-Desc in trash was treated as "default" and removed
		const input = `${trashFolderId}:date-Asc,BDLV`;
		const prefToUpdate = `${trashFolderId}:date-Desc`;

		const result = modifySettingString(input, prefToUpdate, trashFolderId);

		// Should update, not remove the entry
		expect(result).toBe(`${trashFolderId}:date-Desc,BDLV`);
	});
});
