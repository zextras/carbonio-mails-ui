/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useEffect } from 'react';

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { mergeRegister } from '@lexical/utils';
import {
	$getSelection,
	$insertNodes,
	$isNodeSelection,
	COMMAND_PRIORITY_EDITOR,
	createCommand,
	type LexicalCommand
} from 'lexical';

import { $createImageNode, $isImageNode, type ImageAlignment } from './nodes/image-node';

export type InsertInlineImagePayload = {
	src: string;
	cidUrl: string | undefined;
	altText?: string;
};

export const INSERT_INLINE_IMAGE_COMMAND: LexicalCommand<InsertInlineImagePayload> = createCommand(
	'INSERT_INLINE_IMAGE_COMMAND'
);

export const SET_INLINE_IMAGE_ALIGNMENT_COMMAND: LexicalCommand<ImageAlignment | undefined> =
	createCommand('SET_INLINE_IMAGE_ALIGNMENT_COMMAND');

function $applyImageAlignment(alignment: ImageAlignment | undefined): void {
	const selection = $getSelection();
	if (!$isNodeSelection(selection)) {
		return;
	}
	selection.getNodes().forEach((node) => {
		if ($isImageNode(node)) {
			node.setAlignment(alignment);
		}
	});
}

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
			mergeRegister(
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
				editor.registerCommand<ImageAlignment | undefined>(
					SET_INLINE_IMAGE_ALIGNMENT_COMMAND,
					(alignment) => {
						editor.update(() => $applyImageAlignment(alignment));
						return true;
					},
					COMMAND_PRIORITY_EDITOR
				)
			),
		[editor]
	);

	return null;
};
