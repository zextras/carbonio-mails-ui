/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useEffect } from 'react';

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $dfs, mergeRegister } from '@lexical/utils';
import {
	$getSelection,
	$insertNodes,
	$isNodeSelection,
	COMMAND_PRIORITY_EDITOR,
	createCommand,
	type LexicalCommand,
	type LexicalEditor
} from 'lexical';

import {
	$createImageNode,
	$isImageNode,
	type ImageNode,
	type ImageAlignment
} from './nodes/image-node';
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
 * An image picked from the device, resolved into something the editor can
 * display. How it is resolved depends on the host editor: the mail composer
 * uploads the file as an inline attachment (so `src` is the local preview of the
 * upload in flight, later swapped for the download-service URL, and `cidUrl` the
 * matching cid), while the signature editor embeds it as a `data:` URI (so there
 * is no cid).
 */
export type ResolvedInlineImage = {
	src?: string;
	cidUrl?: string;
};

/**
 * The editor is handed over so that a resolver can act on the inserted images
 * afterwards: the mail composer drops the ones whose upload ends up failing
 * ({@link REMOVE_INLINE_IMAGE_COMMAND}).
 */
export type ResolveInlineImages = (
	editor: LexicalEditor,
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

/**
 * All the inline images of the editor content.
 */
export function $getInlineImageNodes(): Array<ImageNode> {
	return $dfs()
		.map(({ node }) => node)
		.filter($isImageNode);
}

/**
 * All the inline images referring the given cid. There is normally just one, but
 * the same image can be duplicated by a copy/paste inside the editor, in which
 * case every copy has to be kept in sync.
 */
function $getImageNodesByCidUrl(cidUrl: string): Array<ImageNode> {
	return $getInlineImageNodes().filter((node) => node.getCidUrl() === cidUrl);
}

function $setImageNodesSrcByCidUrl(cidUrl: string, src: string): void {
	$getImageNodesByCidUrl(cidUrl).forEach((node) => node.setSrc(src));
}

function $removeImageNodesByCidUrl(cidUrl: string): void {
	$getImageNodesByCidUrl(cidUrl).forEach((node) => node.remove());
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
						editor.update(() => $setImageNodesSrcByCidUrl(cidUrl, src));
						return true;
					},
					COMMAND_PRIORITY_EDITOR
				),
				editor.registerCommand<RemoveInlineImagePayload>(
					REMOVE_INLINE_IMAGE_COMMAND,
					({ cidUrl }) => {
						editor.update(() => $removeImageNodesByCidUrl(cidUrl));
						return true;
					},
					COMMAND_PRIORITY_EDITOR
				)
			),
		[editor]
	);

	return null;
};
