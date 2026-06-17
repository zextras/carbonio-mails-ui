/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useEffect } from 'react';

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $insertNodes, COMMAND_PRIORITY_EDITOR, createCommand, type LexicalCommand } from 'lexical';

import { $createImageNode } from './nodes/image-node';

export type InsertInlineImagePayload = {
	src: string;
	cidUrl: string | undefined;
	altText?: string;
};

export const INSERT_INLINE_IMAGE_COMMAND: LexicalCommand<InsertInlineImagePayload> = createCommand(
	'INSERT_INLINE_IMAGE_COMMAND'
);

/**
 * Registers the command that inserts an inline image ({@link ImageNode}) at the
 * current selection. The upload of the file and the cid bookkeeping are handled
 * by whoever dispatches the command (the toolbar image button / the paste
 * handler), which only provides the resolved download URL and cid.
 */
export const ImagePlugin = (): null => {
	const [editor] = useLexicalComposerContext();

	useEffect(
		() =>
			editor.registerCommand<InsertInlineImagePayload>(
				INSERT_INLINE_IMAGE_COMMAND,
				({ src, cidUrl, altText }) => {
					editor.update(() => {
						$insertNodes([$createImageNode(src, cidUrl, altText)]);
					});
					return true;
				},
				COMMAND_PRIORITY_EDITOR
			),
		[editor]
	);

	return null;
};
