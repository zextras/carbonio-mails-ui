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
	$nodesOfType,
	COMMAND_PRIORITY_EDITOR,
	createCommand,
	type LexicalCommand
} from 'lexical';

import { $createImageNode, $isImageNode, ImageNode, type ImageAlignment } from './nodes/image-node';
import { type ImageDimension } from './nodes/image-types';

export { OPEN_IMAGE_MODAL_COMMAND } from './nodes/image-types';

export type InsertInlineImagePayload = {
	src: string;
	cidUrl: string | undefined;
	altText?: string;
	width?: ImageDimension;
	height?: ImageDimension;
};

export const INSERT_INLINE_IMAGE_COMMAND: LexicalCommand<InsertInlineImagePayload> = createCommand(
	'INSERT_INLINE_IMAGE_COMMAND'
);

export const SET_INLINE_IMAGE_ALIGNMENT_COMMAND: LexicalCommand<ImageAlignment | undefined> =
	createCommand('SET_INLINE_IMAGE_ALIGNMENT_COMMAND');

export type ReplaceInlineImageSrcPayload = {
	cidUrl: string;
	src: string;
};

export const REPLACE_INLINE_IMAGE_SRC_COMMAND: LexicalCommand<ReplaceInlineImageSrcPayload> =
	createCommand('REPLACE_INLINE_IMAGE_SRC_COMMAND');

export type RemoveInlineImagePayload = {
	cidUrl: string;
};

export const REMOVE_INLINE_IMAGE_COMMAND: LexicalCommand<RemoveInlineImagePayload> = createCommand(
	'REMOVE_INLINE_IMAGE_COMMAND'
);

/**
 * All the inline images referring the given cid. There is normally just one, but
 * the same image can be duplicated by a copy/paste inside the editor, in which
 * case every copy has to be kept in sync.
 */
function $getImageNodesByCidUrl(cidUrl: string): Array<ImageNode> {
	return $nodesOfType(ImageNode).filter((node) => node.getCidUrl() === cidUrl);
}

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
 * handler), which only provides the src to display and the cid.
 *
 * A freshly inserted image is displayed straight away through a local preview
 * url, while its upload and draft save are still in flight; the cid is the
 * handle used to later replace that preview with the real download url
 * ({@link REPLACE_INLINE_IMAGE_SRC_COMMAND}) or to drop the image altogether if
 * its upload fails ({@link REMOVE_INLINE_IMAGE_COMMAND}).
 */
export const ImagePlugin = (): null => {
	const [editor] = useLexicalComposerContext();

	useEffect(
		() =>
			mergeRegister(
				editor.registerCommand<InsertInlineImagePayload>(
					INSERT_INLINE_IMAGE_COMMAND,
					({ src, cidUrl, altText, width, height }) => {
						editor.update(() => {
							$insertNodes([$createImageNode(src, cidUrl, altText, width, height)]);
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
				),
				editor.registerCommand<ReplaceInlineImageSrcPayload>(
					REPLACE_INLINE_IMAGE_SRC_COMMAND,
					({ cidUrl, src }) => {
						// Not tagged as `history-merge`, so that the change reaches the
						// store through the OnChangePlugin and the persisted html holds the
						// download url instead of the local preview one.
						editor.update(() => {
							$getImageNodesByCidUrl(cidUrl).forEach((node) => node.setSrc(src));
						});
						return true;
					},
					COMMAND_PRIORITY_EDITOR
				),
				editor.registerCommand<RemoveInlineImagePayload>(
					REMOVE_INLINE_IMAGE_COMMAND,
					({ cidUrl }) => {
						editor.update(() => {
							$getImageNodesByCidUrl(cidUrl).forEach((node) => node.remove());
						});
						return true;
					},
					COMMAND_PRIORITY_EDITOR
				)
			),
		[editor]
	);

	return null;
};
