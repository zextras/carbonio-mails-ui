/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useEffect } from 'react';

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { COMMAND_PRIORITY_LOW, PASTE_COMMAND } from 'lexical';

import { INSERT_INLINE_IMAGE_COMMAND } from './image-plugin';
import { useEditorAttachments } from 'store/editor/index';
import { MailsEditorV2 } from 'types/editor';

type PastePluginProps = {
	editorId: MailsEditorV2['id'];
};

/**
 * cid-aware paste handling: image files in the clipboard are uploaded as inline
 * attachments and inserted as {@link ImageNode}s (preserving the cid), while
 * plain text and HTML paste fall through to the default RichTextPlugin handler.
 */
export const PastePlugin = ({ editorId }: PastePluginProps): null => {
	const [editor] = useLexicalComposerContext();
	const { addInlineAttachments } = useEditorAttachments(editorId);

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
					addInlineAttachments(imageFiles, {
						onSaveComplete: (inlineAttachments) => {
							inlineAttachments.forEach((attachment) => {
								if (attachment.downloadServiceUrl) {
									editor.dispatchCommand(INSERT_INLINE_IMAGE_COMMAND, {
										src: attachment.downloadServiceUrl,
										cidUrl: attachment.cidUrl,
										altText: 'Inline attachment'
									});
								}
							});
						}
					});
					return true;
				},
				COMMAND_PRIORITY_LOW
			),
		[editor, addInlineAttachments]
	);

	return null;
};
