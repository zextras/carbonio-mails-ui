/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import assert from 'node:assert';
import type { Editor, Ui } from 'tinymce/tinymce';

import { createTinyMCESetup } from '../tinymce-setup-utils';

describe('tinymce-setup-utils', () => {
	describe('createTinyMCESetup', () => {
		let mockEditor: Partial<Editor>;
		let mockAddMenuButton: jest.Mock;
		let mockOnFileSelect: jest.Mock;
		let mockOnFileClick: jest.Mock;

		beforeEach(() => {
			mockAddMenuButton = jest.fn();
			mockOnFileSelect = jest.fn();
			mockOnFileClick = jest.fn();

			mockEditor = {
				ui: {
					registry: {
						addMenuButton: mockAddMenuButton
					}
				}
			} as unknown as Partial<Editor>;
		});

		afterEach(() => {
			jest.clearAllMocks();
		});

		it('should return a setup function', () => {
			const setup = createTinyMCESetup({
				onFileSelect: mockOnFileSelect,
				onFileClick: mockOnFileClick,
				inlineLabel: 'Add inline image',
				selectImageTooltip: 'Select image'
			});

			expect(typeof setup).toBe('function');
		});

		it('should register imageSelector menu button when onFileSelect is provided', () => {
			const setup = createTinyMCESetup({
				onFileSelect: mockOnFileSelect,
				onFileClick: mockOnFileClick,
				inlineLabel: 'Add inline image',
				selectImageTooltip: 'Select image'
			});

			assert(typeof setup === 'function');
			setup(mockEditor as Editor);

			expect(mockAddMenuButton).toHaveBeenCalledWith('imageSelector', {
				icon: 'gallery',
				tooltip: 'Select image',
				fetch: expect.any(Function)
			});
		});

		it('should not register imageSelector menu button when onFileSelect is not provided', () => {
			const setup = createTinyMCESetup({
				onFileClick: mockOnFileClick,
				inlineLabel: 'Add inline image',
				selectImageTooltip: 'Select image'
			});

			assert(typeof setup === 'function');
			setup(mockEditor as Editor);

			expect(mockAddMenuButton).not.toHaveBeenCalled();
		});

		it('should not register imageSelector menu button when onFileSelect is undefined', () => {
			const setup = createTinyMCESetup({
				onFileSelect: undefined,
				onFileClick: mockOnFileClick,
				inlineLabel: 'Add inline image',
				selectImageTooltip: 'Select image'
			});

			assert(typeof setup === 'function');
			setup(mockEditor as Editor);

			expect(mockAddMenuButton).not.toHaveBeenCalled();
		});

		it('should create menu items with correct properties when fetch is called', () => {
			const setup = createTinyMCESetup({
				onFileSelect: mockOnFileSelect,
				onFileClick: mockOnFileClick,
				inlineLabel: 'Add inline image',
				selectImageTooltip: 'Select image'
			});

			assert(typeof setup === 'function');
			setup(mockEditor as Editor);

			// Get the fetch function that was passed to addMenuButton
			const addMenuButtonCall = mockAddMenuButton.mock.calls[0];
			const menuButtonConfig = addMenuButtonCall[1];
			const fetchFunction = menuButtonConfig.fetch;

			// Mock the callback function
			const mockCallback = jest.fn();

			// Call the fetch function
			fetchFunction(mockCallback);

			// Verify the callback was called with correct menu items
			expect(mockCallback).toHaveBeenCalledWith([
				{
					type: 'menuitem',
					text: 'Add inline image',
					onAction: expect.any(Function)
				}
			]);
		});

		it('should call onFileClick when menu item onAction is triggered', () => {
			const setup = createTinyMCESetup({
				onFileSelect: mockOnFileSelect,
				onFileClick: mockOnFileClick,
				inlineLabel: 'Add inline image',
				selectImageTooltip: 'Select image'
			});

			assert(typeof setup === 'function');
			setup(mockEditor as Editor);

			// Get the fetch function
			const addMenuButtonCall = mockAddMenuButton.mock.calls[0];
			const menuButtonConfig = addMenuButtonCall[1];
			const fetchFunction = menuButtonConfig.fetch;

			// Mock the callback function
			const mockCallback = jest.fn();

			// Call the fetch function to get menu items
			fetchFunction(mockCallback);

			// Get the menu items that were passed to the callback
			const menuItems: Ui.Menu.MenuItemSpec[] = mockCallback.mock.calls[0][0];
			const firstMenuItem = menuItems[0];

			// Trigger the onAction of the first menu item
			if (firstMenuItem.type === 'menuitem' && firstMenuItem.onAction) {
				firstMenuItem.onAction({
					isEnabled(): boolean {
						return false;
					},
					// eslint-disable-next-line unused-imports/no-unused-vars,@typescript-eslint/no-empty-function
					setEnabled(state: boolean): void {}
				});
			}

			// Verify onFileClick was called
			expect(mockOnFileClick).toHaveBeenCalledTimes(1);
		});

		it('should use correct icon for imageSelector button', () => {
			const setup = createTinyMCESetup({
				onFileSelect: mockOnFileSelect,
				onFileClick: mockOnFileClick,
				inlineLabel: 'Add inline image',
				selectImageTooltip: 'Select image'
			});

			assert(typeof setup === 'function');
			setup(mockEditor as Editor);

			const addMenuButtonCall = mockAddMenuButton.mock.calls[0];
			const menuButtonConfig = addMenuButtonCall[1];

			expect(menuButtonConfig.icon).toBe('gallery');
		});

		it('should use provided tooltip for imageSelector button', () => {
			const customTooltip = 'Custom image selector tooltip';
			const setup = createTinyMCESetup({
				onFileSelect: mockOnFileSelect,
				onFileClick: mockOnFileClick,
				inlineLabel: 'Add inline image',
				selectImageTooltip: customTooltip
			});

			assert(typeof setup === 'function');
			setup(mockEditor as Editor);

			const addMenuButtonCall = mockAddMenuButton.mock.calls[0];
			const menuButtonConfig = addMenuButtonCall[1];

			expect(menuButtonConfig.tooltip).toBe(customTooltip);
		});

		it('should use provided label for menu item text', () => {
			const customLabel = 'Custom inline image label';
			const setup = createTinyMCESetup({
				onFileSelect: mockOnFileSelect,
				onFileClick: mockOnFileClick,
				inlineLabel: customLabel,
				selectImageTooltip: 'Select image'
			});

			assert(typeof setup === 'function');
			setup(mockEditor as Editor);

			// Get the fetch function and call it
			const addMenuButtonCall = mockAddMenuButton.mock.calls[0];
			const menuButtonConfig = addMenuButtonCall[1];
			const fetchFunction = menuButtonConfig.fetch;
			const mockCallback = jest.fn();
			fetchFunction(mockCallback);

			// Check the menu item text
			const menuItems: Ui.Menu.MenuItemSpec[] = mockCallback.mock.calls[0][0];
			const firstMenuItem = menuItems[0];

			expect(firstMenuItem.text).toBe(customLabel);
		});

		it('should handle editor without ui registry gracefully', () => {
			const mockEditorWithoutUI = {} as Editor;

			const setup = createTinyMCESetup({
				onFileSelect: mockOnFileSelect,
				onFileClick: mockOnFileClick,
				inlineLabel: 'Add inline image',
				selectImageTooltip: 'Select image'
			});

			// This should not throw an error
			assert(typeof setup === 'function');
			expect(() => setup(mockEditorWithoutUI)).not.toThrow();
		});

		it('should create exactly one menu item in the items array', () => {
			const setup = createTinyMCESetup({
				onFileSelect: mockOnFileSelect,
				onFileClick: mockOnFileClick,
				inlineLabel: 'Add inline image',
				selectImageTooltip: 'Select image'
			});

			assert(typeof setup === 'function');
			setup(mockEditor as Editor);

			const addMenuButtonCall = mockAddMenuButton.mock.calls[0];
			const menuButtonConfig = addMenuButtonCall[1];
			const fetchFunction = menuButtonConfig.fetch;
			const mockCallback = jest.fn();
			fetchFunction(mockCallback);

			const menuItems: Ui.Menu.MenuItemSpec[] = mockCallback.mock.calls[0][0];
			expect(menuItems).toHaveLength(1);
			expect(menuItems[0].type).toBe('menuitem');
		});
	});
});
