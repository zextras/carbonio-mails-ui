/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import {
	createFileClickHandler,
	createFileInputChangeHandler,
	createImageSelectorMenuItems
} from 'views/app/detail-panel/edit/composer/file-handler-utils';

const mockedTinymce = {
	default: 'mocked-tinymce'
};
jest.mock('tinymce/tinymce', () => mockedTinymce, { virtual: true });

describe('file-handler-utils', () => {
	describe('createFileClickHandler', () => {
		it('should clear input value and trigger click when input ref exists', () => {
			const mockInput = {
				value: 'existing-value',
				click: jest.fn()
			};
			const inputRef = { current: mockInput as unknown as HTMLInputElement };

			const handler = createFileClickHandler(inputRef);
			handler();

			expect(mockInput.value).toBe('');
			expect(mockInput.click).toHaveBeenCalledTimes(1);
		});

		it('should do nothing when input ref is null', () => {
			const inputRef = { current: null };

			const handler = createFileClickHandler(inputRef);

			// Should not throw error
			expect(() => handler()).not.toThrow();
		});
	});

	describe('createFileInputChangeHandler', () => {
		it('should call onFileSelect with editor and files when ref exists', () => {
			const mockFiles = [] as unknown as FileList;
			const mockInput = { files: mockFiles };
			const inputRef = { current: mockInput as HTMLInputElement };
			const mockOnFileSelect = jest.fn();

			const handler = createFileInputChangeHandler(inputRef, mockOnFileSelect);
			handler();

			expect(mockOnFileSelect).toHaveBeenCalledWith({
				editor: mockedTinymce,
				files: mockFiles
			});
		});

		it('should not call onFileSelect when callback is not provided', () => {
			const inputRef = { current: { files: [] as unknown as FileList } as HTMLInputElement };

			const handler = createFileInputChangeHandler(inputRef);

			// Should not throw error
			expect(() => handler()).not.toThrow();
		});

		it('should handle null input ref gracefully', () => {
			const inputRef = { current: null };
			const mockOnFileSelect = jest.fn();

			const handler = createFileInputChangeHandler(inputRef, mockOnFileSelect);
			handler();

			expect(mockOnFileSelect).toHaveBeenCalledWith({
				editor: mockedTinymce,
				files: undefined
			});
		});
	});

	describe('createImageSelectorMenuItems', () => {
		it('should create menu item with correct properties', () => {
			const mockOnFileClick = jest.fn();
			const inlineLabel = 'Add inline image';

			const result = createImageSelectorMenuItems(inlineLabel, mockOnFileClick);

			expect(result).toHaveLength(1);
			expect(result[0]).toEqual({
				type: 'menuitem',
				text: inlineLabel,
				onAction: expect.any(Function)
			});
		});

		it('should call onFileClick when menu item action is triggered', () => {
			const mockOnFileClick = jest.fn();
			const inlineLabel = 'Add inline image';

			const result = createImageSelectorMenuItems(inlineLabel, mockOnFileClick);
			const menuItem = result[0];

			if ('onAction' in menuItem && typeof menuItem.onAction === 'function') {
				menuItem.onAction({
					isEnabled(): boolean {
						throw new Error('Function not implemented.');
					},
					// eslint-disable-next-line unused-imports/no-unused-vars
					setEnabled(state: boolean): void {
						throw new Error('Function not implemented.');
					}
				});
			}

			expect(mockOnFileClick).toHaveBeenCalledTimes(1);
		});
	});
});
