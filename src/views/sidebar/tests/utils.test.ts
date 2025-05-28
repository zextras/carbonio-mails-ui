/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { FOLDERS, OnDropActionProps } from '@zextras/carbonio-ui-commons';

import { handleDragEnter } from '../utils';
import { generateFolder } from '@test-utils/folders/folders-generator';

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
		const data = { type: 'conversation', data: { parentFolderId: 'folder2' } } as OnDropActionProps;
		const result = handleDragEnter(data, { ...folder, id: FOLDERS.USER_ROOT });
		expect(result).toEqual({ success: false });
	});

	it('should return success false for folder type with same id', () => {
		const data = { type: 'folder', data: { id: 'folder1' } } as OnDropActionProps;
		const result = handleDragEnter(data, folder);
		expect(result).toEqual({ success: false });
	});

	it('should return undefined for valid drag enter', () => {
		const data = { type: 'conversation', data: { parentFolderId: 'folder2' } } as OnDropActionProps;
		const result = handleDragEnter(data, folder);
		expect(result).toBeUndefined();
	});
});
