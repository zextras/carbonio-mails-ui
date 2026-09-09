/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useEffect } from 'react';

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { COMMAND_PRIORITY_LOW, PASTE_COMMAND } from 'lexical';

import { insertResolvedInlineImages, type ResolveInlineImages } from './image-plugin';

type PastePluginProps = {
	/**
	 * Resolves the pasted image files into sources the editor can display, the
	 * same way the toolbar's "insert image from device" button does: an upload as
	 * inline attachment in the mail composer, a `data:` URI in the signature
	 * editor.
	 */
	onResolveInlineImages: ResolveInlineImages;
};

/**
 * Paste handling for images: image files in the clipboard are resolved through
 * {@link PastePluginProps.onResolveInlineImages} and inserted as
 * {@link ImageNode}s (preserving the cid, when there is one), while plain text
 * and HTML paste fall through to the default RichTextPlugin handler.
 */
export const PastePlugin = ({ onResolveInlineImages }: PastePluginProps): null => {
	const [editor] = useLexicalComposerContext();

	useEffect(
		() =>
			editor.registerCommand<ClipboardEvent>(
				PASTE_COMMAND,
				(event) => {
					const items = event.clipboardData?.items;
					if (!items) {
						return false;
					}

					// Copying a table (or any rich selection) from Excel, Pages, Word
					// etc. populates the clipboard with both an HTML representation
					// and a flattened image snapshot, for apps that can't handle rich
					// paste. Whenever HTML is present it takes priority — the default
					// handler below already knows how to turn it into real table/
					// formatted nodes — otherwise this would wrongly paste the image
					// snapshot instead of the actual table.
					const html = event.clipboardData?.getData('text/html') ?? '';
					if (html.trim() !== '') {
						return false;
					}

					const imageFiles = Array.from(items)
						.filter((item) => item.kind === 'file' && item.type.startsWith('image/'))
						.map((item) => item.getAsFile())
						.filter((file): file is File => file != null);

					// Let the default handler deal with text/HTML paste.
					if (imageFiles.length === 0) {
						return false;
					}

					event.preventDefault();
					onResolveInlineImages(editor, imageFiles, (images) =>
						insertResolvedInlineImages(editor, images)
					);
					return true;
				},
				COMMAND_PRIORITY_LOW
			),
		[editor, onResolveInlineImages]
	);

	return null;
};
