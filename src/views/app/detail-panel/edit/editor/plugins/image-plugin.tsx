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
	type LexicalCommand,
	type LexicalEditor
} from 'lexical';

import { $createImageNode, $isImageNode, type ImageAlignment } from './nodes/image-node';
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

/**
 * An image picked from the device, resolved into something the editor can
 * display. How it is resolved depends on the host editor: the mail composer
 * uploads the file as an inline attachment (so `src` is a download-service URL
 * and `cidUrl` the matching cid), while the signature editor embeds it as a
 * `data:` URI (so there is no cid).
 */
export type ResolvedInlineImage = {
	src?: string;
	cidUrl?: string;
};

export type ResolveInlineImages = (
	files: File[],
	onComplete: (images: ResolvedInlineImage[]) => void
) => void;

/**
 * Inserts the resolved images at the current selection, skipping the ones whose
 * resolution failed. Shared by the toolbar's image button and the paste handler.
 */
export const insertResolvedInlineImages = (
	editor: LexicalEditor,
	images: ResolvedInlineImage[]
): void => {
	images.forEach((image) => {
		if (image.src) {
			editor.dispatchCommand(INSERT_INLINE_IMAGE_COMMAND, {
				src: image.src,
				cidUrl: image.cidUrl,
				altText: 'Inline attachment'
			});
		}
	});
};

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
				)
			),
		[editor]
	);

	return null;
};
