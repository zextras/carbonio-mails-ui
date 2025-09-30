/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { RefObject } from 'react';

import type { TinyMCE, Ui } from 'tinymce/tinymce';

export interface FileSelectCallbackArg {
	editor: TinyMCE;
	files: HTMLInputElement['files'] | undefined;
}

/**
 * Creates a file click handler that triggers file input selection
 * @param inputRef - Reference to the file input element
 * @returns Function to trigger file selection
 */
export function createFileClickHandler(inputRef: RefObject<HTMLInputElement>) {
	return (): void => {
		if (inputRef.current) {
			inputRef.current.value = '';
			inputRef.current.click();
		}
	};
}

/**
 * Creates a file input change handler for TinyMCE
 * @param inputRef - Reference to the file input element
 * @param onFileSelect - Callback when files are selected
 * @returns Function to handle file input changes
 */
export function createFileInputChangeHandler(
	inputRef: RefObject<HTMLInputElement>,
	onFileSelect?: (arg: FileSelectCallbackArg) => void
) {
	return (): void => {
		// eslint-disable-next-line global-require,@typescript-eslint/no-var-requires
		const tinymce = require('tinymce/tinymce');
		onFileSelect?.({ editor: tinymce, files: inputRef?.current?.files });
	};
}

/**
 * Creates menu items for image selection in TinyMCE
 * @param inlineLabel - Label for the inline image menu item
 * @param onFileClick - Handler for file click action
 * @returns Array of menu item specifications
 */
export function createImageSelectorMenuItems(
	inlineLabel: string,
	onFileClick: () => void
): Ui.Menu.MenuItemSpec[] {
	return [
		{
			type: 'menuitem',
			text: inlineLabel,
			onAction: (): void => {
				onFileClick();
			}
		}
	];
}
