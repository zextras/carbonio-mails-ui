/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useEffect } from 'react';

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $dfs, mergeRegister } from '@lexical/utils';
import {
	$createRangeSelection,
	$getNearestNodeFromDOMNode,
	$getNodeByKey,
	$getSelection,
	$insertNodes,
	$isElementNode,
	$isNodeSelection,
	$isTextNode,
	$setSelection,
	COMMAND_PRIORITY_EDITOR,
	COMMAND_PRIORITY_LOW,
	createCommand,
	DRAGOVER_COMMAND,
	DRAGSTART_COMMAND,
	DROP_COMMAND,
	type LexicalCommand,
	type LexicalEditor,
	type NodeKey,
	type RangeSelection
} from 'lexical';

import {
	$createImageNode,
	$isImageNode,
	type ImageNode,
	type ImageAlignment
} from './nodes/image-node';
import { type ImageDimension } from './nodes/image-types';

export { OPEN_IMAGE_MODAL_COMMAND } from './nodes/image-types';

const IMAGE_DRAG_MIME_TYPE = 'application/x-carbonio-mails-inline-image';

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

type ImageDragPayload = { editorKey: string; nodeKey: NodeKey };

function parseImageDragPayload(raw: string): ImageDragPayload | null {
	try {
		const parsed: unknown = JSON.parse(raw);
		if (
			typeof parsed === 'object' &&
			parsed !== null &&
			'editorKey' in parsed &&
			'nodeKey' in parsed &&
			typeof parsed.editorKey === 'string' &&
			typeof parsed.nodeKey === 'string'
		) {
			return { editorKey: parsed.editorKey, nodeKey: parsed.nodeKey };
		}
	} catch {
		// Not our payload
	}
	return null;
}

function getDomPointFromCoordinates(x: number, y: number): { node: Node; offset: number } | null {
	if (typeof document.caretPositionFromPoint === 'function') {
		const position = document.caretPositionFromPoint(x, y);
		return position ? { node: position.offsetNode, offset: position.offset } : null;
	}
	if (typeof document.caretRangeFromPoint === 'function') {
		const range = document.caretRangeFromPoint(x, y);
		return range ? { node: range.startContainer, offset: range.startOffset } : null;
	}
	return null;
}

/**
 * Builds a collapsed selection at the position under the pointer, or null when
 * the pointer is not over any editor node.
 */
function $createSelectionFromDomPoint(domPoint: {
	node: Node;
	offset: number;
}): RangeSelection | null {
	const target = $getNearestNodeFromDOMNode(domPoint.node);
	if (!target) {
		return null;
	}
	const selection = $createRangeSelection();
	if ($isTextNode(target)) {
		selection.anchor.set(target.getKey(), domPoint.offset, 'text');
		selection.focus.set(target.getKey(), domPoint.offset, 'text');
	} else if ($isElementNode(target)) {
		const offset = Math.min(domPoint.offset, target.getChildrenSize());
		selection.anchor.set(target.getKey(), offset, 'element');
		selection.focus.set(target.getKey(), offset, 'element');
	} else {
		// Decorator (e.g. another image): land right after it.
		const parentKey = target.getParentOrThrow().getKey();
		const offset = target.getIndexWithinParent() + 1;
		selection.anchor.set(parentKey, offset, 'element');
		selection.focus.set(parentKey, offset, 'element');
	}
	return selection;
}

/**
 * Moves the dragged image where it has been dropped. The image is re-created
 * (same src/cid/size/alignment) at the drop point and the original is removed,
 * so the cid bookkeeping is untouched. Dropping on the image itself is a no-op.
 */
function $moveImageToDropPoint(editor: LexicalEditor, rawPayload: string, event: DragEvent): void {
	const payload = parseImageDragPayload(rawPayload);
	if (!payload || payload.editorKey !== editor.getKey()) {
		return;
	}
	const source = $getNodeByKey(payload.nodeKey);
	const domPoint = getDomPointFromCoordinates(event.clientX, event.clientY);
	if (!$isImageNode(source) || !domPoint) {
		return;
	}
	const selection = $createSelectionFromDomPoint(domPoint);
	if (!selection) {
		return;
	}
	const droppedOnSource = $getNearestNodeFromDOMNode(domPoint.node)?.is(source);
	if (droppedOnSource) {
		return;
	}
	$setSelection(selection);
	// Inserted before removing the source: removing it first could shift the
	// drop point.
	$insertNodes([
		$createImageNode(
			source.getSrc(),
			source.getCidUrl(),
			source.getAltText(),
			source.getWidth(),
			source.getHeight(),
			source.getAlignment()
		)
	]);
	source.remove();
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
				),
				editor.registerCommand(
					DRAGSTART_COMMAND,
					(event: DragEvent) => {
						if (!(event.target instanceof HTMLImageElement)) {
							return false;
						}
						const node = $getNearestNodeFromDOMNode(event.target);
						if (!$isImageNode(node) || !event.dataTransfer) {
							return false;
						}
						const payload: ImageDragPayload = {
							editorKey: editor.getKey(),
							nodeKey: node.getKey()
						};
						event.dataTransfer.setData(IMAGE_DRAG_MIME_TYPE, JSON.stringify(payload));
						// eslint-disable-next-line no-param-reassign -- the DataTransfer is meant to be configured by the dragstart handler
						event.dataTransfer.effectAllowed = 'move';
						return true;
					},
					COMMAND_PRIORITY_LOW
				),
				editor.registerCommand(
					DRAGOVER_COMMAND,
					(event: DragEvent) => {
						if (!event.dataTransfer?.types.includes(IMAGE_DRAG_MIME_TYPE)) {
							return false;
						}
						// Allows the drop and shows the caret where the image will land.
						event.preventDefault();
						return true;
					},
					COMMAND_PRIORITY_LOW
				),
				editor.registerCommand(
					DROP_COMMAND,
					(event: DragEvent) => {
						const raw = event.dataTransfer?.getData(IMAGE_DRAG_MIME_TYPE);
						if (!raw) {
							return false;
						}
						// Handled from now on: the browser default would insert a copy of the
						// <img> natively, bypassing the editor state.
						event.preventDefault();
						$moveImageToDropPoint(editor, raw, event);
						return true;
					},
					COMMAND_PRIORITY_LOW
				)
			),
		[editor]
	);

	return null;
};
