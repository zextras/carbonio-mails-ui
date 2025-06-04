/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Folder, FOLDERS, OnDropActionProps, ROOT_NAME } from '@zextras/carbonio-ui-commons';

import { generateFolder } from '@test-utils/folders/folders-generator';
import {
	getFolderIconName,
	getTotalUnreadCountInSubfolders,
	handleDragEnter
} from 'views/sidebar/utils';

describe('utils', () => {
	describe('handleDragEnter', () => {
		const folder = generateFolder({
			id: 'folder1',
			isLink: false,
			perm: 'rw',
			oname: 'folder1'
		});

		it('should return success false for same folder', () => {
			const data = {
				type: 'conversation',
				data: { parentFolderId: 'folder1' }
			} as OnDropActionProps;
			const result = handleDragEnter(data, folder);
			expect(result).toEqual({ success: false });
		});

		it('should return success false for restricted inbox targets', () => {
			const data = {
				type: 'conversation',
				data: { parentFolderId: FOLDERS.INBOX }
			} as OnDropActionProps;
			const result = handleDragEnter(data, { ...folder, id: FOLDERS.SENT });
			expect(result).toEqual({ success: false });
		});

		it('should return success false for restricted draft targets', () => {
			const data = {
				type: 'conversation',
				data: { parentFolderId: FOLDERS.DRAFTS }
			} as OnDropActionProps;
			const result = handleDragEnter(data, { ...folder, id: FOLDERS.INBOX });
			expect(result).toEqual({ success: false });
		});

		it('should return success false for restricted destinations', () => {
			const data = {
				type: 'conversation',
				data: { parentFolderId: 'folder2' }
			} as OnDropActionProps;
			const result = handleDragEnter(data, { ...folder, id: FOLDERS.USER_ROOT });
			expect(result).toEqual({ success: false });
		});

		it('should return success false for folder type with same id', () => {
			const data = { type: 'folder', data: { id: 'folder1' } } as OnDropActionProps;
			const result = handleDragEnter(data, folder);
			expect(result).toEqual({ success: false });
		});

		it('should return undefined for valid drag enter', () => {
			const data = {
				type: 'conversation',
				data: { parentFolderId: 'folder2' }
			} as OnDropActionProps;
			const result = handleDragEnter(data, folder);
			expect(result).toBeUndefined();
		});
	});
	describe('getFolderIconName', () => {
		const baseFolder = (id: string, extra?: Partial<Folder>): Folder =>
			generateFolder({ id, ...extra });
		it('returns correct icon for Inbox', () => {
			expect(getFolderIconName(baseFolder(FOLDERS.INBOX))).toBe('InboxOutline');
		});

		it('returns correct icon for Drafts', () => {
			expect(getFolderIconName(baseFolder(FOLDERS.DRAFTS))).toBe('FileOutline');
		});

		it('returns correct icon for Sent', () => {
			expect(getFolderIconName(baseFolder(FOLDERS.SENT))).toBe('PaperPlaneOutline');
		});

		it('returns correct icon for Spam', () => {
			expect(getFolderIconName(baseFolder(FOLDERS.SPAM))).toBe('SlashOutline');
		});

		it('returns correct icon for Trash', () => {
			expect(getFolderIconName(baseFolder(FOLDERS.TRASH))).toBe('Trash2Outline');
		});

		it('returns FolderOutline for unknown system folder', () => {
			expect(getFolderIconName(baseFolder('unknown'))).toBe('FolderOutline');
		});

		it('returns FolderOutline for custom folder', () => {
			expect(getFolderIconName(baseFolder('custom123'))).toBe('FolderOutline');
		});

		it('returns icon with dot when withNotificationDot is true', () => {
			expect(getFolderIconName(baseFolder(FOLDERS.INBOX), true)).toBe('InboxOutlineWithDot');
			expect(getFolderIconName(baseFolder('custom123'), true)).toBe('FolderOutlineWithDot');
		});

		it('returns null for USER_ROOT', () => {
			expect(getFolderIconName(baseFolder(FOLDERS.USER_ROOT))).toBeNull();
		});

		it('returns null for shared root link', () => {
			expect(getFolderIconName({ id: 'someid', isLink: true, oname: ROOT_NAME })).toBeNull();
		});
	});

	describe('getTotalUnreadCountInSubfolders', () => {
		it('should return 0 when no subfolders', () => {
			const folder = generateFolder({
				id: 'folder1',
				isLink: false,
				perm: 'rw',
				oname: 'folder1',
				u: 0,
				n: 0
			});
			expect(getTotalUnreadCountInSubfolders(folder)).toBe(0);
		});
		it('should return 0 when all subfolders have 0 unread messages', () => {
			const folder = generateFolder({
				id: 'folder1',
				isLink: false,
				perm: 'rw',
				oname: 'folder1',
				u: 0,
				n: 0,
				children: [
					generateFolder({ id: 'subfolder1', u: 0, n: 0 }),
					generateFolder({ id: 'subfolder2', u: 0, n: 0 })
				]
			});
			expect(getTotalUnreadCountInSubfolders(folder)).toBe(0);
		});
	});
	it('should return the sum of unread messages in subfolders', () => {
		const folder = generateFolder({
			id: 'folder1',
			isLink: false,
			perm: 'rw',
			oname: 'folder1',
			u: 0,
			n: 0,
			children: [
				generateFolder({ id: 'subfolder1', u: 5, n: 0 }),
				generateFolder({ id: 'subfolder2', u: 3, n: 0 })
			]
		});
		expect(getTotalUnreadCountInSubfolders(folder)).toBe(8);
	});
});
