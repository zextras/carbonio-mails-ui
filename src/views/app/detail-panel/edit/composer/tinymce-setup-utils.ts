/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { EditorOptions } from 'tinymce/tinymce';

import { createImageSelectorMenuItems, type FileSelectCallbackArg } from './file-handler-utils';

/**
 * Creates TinyMCE editor setup callback with image selector functionality
 * @param options - Setup configuration options
 * @returns TinyMCE setup callback function
 */
export function createTinyMCESetup(options: {
	onFileSelect?: (arg: FileSelectCallbackArg) => void;
	onFileClick: () => void;
	inlineLabel: string;
	selectImageTooltip: string;
}): EditorOptions['setup'] {
	const { onFileSelect, onFileClick, inlineLabel, selectImageTooltip } = options;

	return (editor) => {
		if (onFileSelect) {
			editor.ui.registry.addMenuButton('imageSelector', {
				icon: 'gallery',
				tooltip: selectImageTooltip,
				fetch: (callback) => {
					const items = createImageSelectorMenuItems(inlineLabel, onFileClick);
					callback(items);
				}
			});
		}
	};
}
