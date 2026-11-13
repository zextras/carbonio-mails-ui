/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { mergeRegister } from '@lexical/utils';
import {
	$getNearestNodeFromDOMNode,
	$getNodeByKey,
	$getRoot,
	$insertNodes,
	$isElementNode,
	$isRootOrShadowRoot,
	$isTextNode,
	COMMAND_PRIORITY_HIGH,
	DRAGEND_COMMAND,
	DRAGOVER_COMMAND,
	DRAGSTART_COMMAND,
	DROP_COMMAND,
	type ElementNode,
	type LexicalEditor,
	type NodeKey,
	type TextNode
} from 'lexical';

import { $createImageNode, $isImageNode } from './nodes/image-node';
import { INLINE_IMAGE_DRAG_TYPE } from './nodes/image-types';

export const DROP_CARET_TEST_ID = 'inline-image-drop-caret';

/**
 * Payload written in the {@link INLINE_IMAGE_DRAG_TYPE} entry of the
 * `DataTransfer` when an inline image starts being dragged.
 */
type InlineImageDragData = {
	editorKey: string;
	nodeKey: NodeKey;
};

/**
 * Editor position where a dragged image would be dropped, as a Lexical point.
 */
type DropPoint = {
	key: NodeKey;
	offset: number;
	type: 'text' | 'element';
};

function readInlineImageDragData(dataTransfer: DataTransfer | null): InlineImageDragData | null {
	const raw = dataTransfer?.getData(INLINE_IMAGE_DRAG_TYPE);
	if (!raw) {
		return null;
	}
	try {
		const parsed: unknown = JSON.parse(raw);
		if (
			parsed !== null &&
			typeof parsed === 'object' &&
			'editorKey' in parsed &&
			'nodeKey' in parsed &&
			typeof parsed.editorKey === 'string' &&
			typeof parsed.nodeKey === 'string'
		) {
			return { editorKey: parsed.editorKey, nodeKey: parsed.nodeKey };
		}
	} catch {
		// Not a payload of ours
	}
	return null;
}

function isInlineImageDrag(event: DragEvent): boolean {
	return Array.from(event.dataTransfer?.types ?? []).includes(INLINE_IMAGE_DRAG_TYPE);
}

/**
 * The non standard `caretRangeFromPoint`, still the only way to hit test a caret
 * position on the browsers lacking `caretPositionFromPoint` (older Safari).
 */
type LegacyCaretDocument = {
	caretRangeFromPoint?: (x: number, y: number) => Range | null;
};

/**
 * DOM position (node + offset) under the given viewport coordinates, the same
 * way `@lexical/clipboard` resolves the drop point of a text drag.
 */
function caretFromPoint(x: number, y: number): { node: Node; offset: number } | null {
	if (typeof document.caretPositionFromPoint === 'function') {
		const position = document.caretPositionFromPoint(x, y);
		return position ? { node: position.offsetNode, offset: position.offset } : null;
	}
	const legacyDocument: LegacyCaretDocument = document;
	const range = legacyDocument.caretRangeFromPoint?.(x, y) ?? null;
	return range ? { node: range.startContainer, offset: range.startOffset } : null;
}

/**
 * Offset in the text node of a hit, which can be on the text span instead of
 * on its DOM text node.
 */
function textDropOffset(node: TextNode, hit: { node: Node; offset: number }): number {
	const size = node.getTextContentSize();
	if (hit.node.nodeType === Node.TEXT_NODE) {
		return Math.min(hit.offset, size);
	}
	return hit.offset > 0 ? size : 0;
}

function $elementDropPoint(node: ElementNode, offset: number): DropPoint | null {
	if (!$isRootOrShadowRoot(node)) {
		return {
			key: node.getKey(),
			offset: Math.min(offset, node.getChildrenSize()),
			type: 'element'
		};
	}
	// Outside of any block (e.g. below the last paragraph): at the end of the
	// nearest block
	const block = node.getChildAtIndex(Math.min(offset, node.getChildrenSize() - 1));
	return $isElementNode(block)
		? { key: block.getKey(), offset: block.getChildrenSize(), type: 'element' }
		: null;
}

/**
 * The editor position under the pointer of the drag event, or `null` when it
 * cannot be resolved or when it falls on the dragged image itself.
 */
function $resolveDropPoint(
	editor: LexicalEditor,
	event: DragEvent,
	draggedKey: NodeKey
): DropPoint | null {
	const hit = caretFromPoint(event.clientX, event.clientY);
	if (hit === null) {
		return null;
	}
	// The root element is not mapped to the root node (e.g. a hit on the padding
	// below the last paragraph)
	const node =
		hit.node === editor.getRootElement() ? $getRoot() : $getNearestNodeFromDOMNode(hit.node);
	if (node === null || node.getKey() === draggedKey) {
		return null;
	}
	if ($isTextNode(node)) {
		return { key: node.getKey(), offset: textDropOffset(node, hit), type: 'text' };
	}
	if ($isElementNode(node)) {
		return $elementDropPoint(node, hit.offset);
	}
	// A decorator (e.g. another image) or a line break: right after it
	const parent = node.getParent();
	return parent === null
		? null
		: { key: parent.getKey(), offset: node.getIndexWithinParent() + 1, type: 'element' };
}

function $selectDropPoint({ key, offset }: DropPoint): boolean {
	const node = $getNodeByKey(key);
	if ($isTextNode(node) || $isElementNode(node)) {
		node.select(offset, offset);
		return true;
	}
	return false;
}

/**
 * Viewport position and height of the drop caret.
 */
type CaretRect = {
	left: number;
	top: number;
	height: number;
};

function firstRect(rects: DOMRectList | undefined): DOMRect | undefined {
	return rects && rects.length > 0 ? rects[0] : undefined;
}

function lastRect(rects: DOMRectList | undefined): DOMRect | undefined {
	return rects && rects.length > 0 ? rects[rects.length - 1] : undefined;
}

/**
 * The caret at the left (`'start'`) or right (`'end'`) edge of the
 * element, on its first or last line respectively.
 */
function edgeRect(element: HTMLElement, edge: 'start' | 'end'): CaretRect {
	const rects = element.getClientRects();
	const rect =
		(edge === 'start' ? firstRect(rects) : lastRect(rects)) ?? element.getBoundingClientRect();
	return { left: edge === 'start' ? rect.left : rect.right, top: rect.top, height: rect.height };
}

/**
 * Client rect of a caret placed at the given offset of a text node, when the
 * browser can compute it.
 */
function textCaretRect(element: HTMLElement, offset: number): CaretRect | undefined {
	const textNode = document.createTreeWalker(element, NodeFilter.SHOW_TEXT).nextNode();
	if (textNode === null) {
		return undefined;
	}
	const range = document.createRange();
	range.setStart(textNode, Math.min(offset, textNode.textContent?.length ?? 0));
	range.collapse(true);
	// Not implemented by every DOM (e.g. jsdom)
	const rect =
		typeof range.getClientRects === 'function' ? firstRect(range.getClientRects()) : undefined;
	return rect && rect.height > 0 ? rect : undefined;
}

/**
 * Viewport rect of the caret displayed at the drop point while dragging.
 */
function $getDropPointRect(editor: LexicalEditor, point: DropPoint): CaretRect | null {
	const element = editor.getElementByKey(point.key);
	if (element === null) {
		return null;
	}
	if (point.type === 'text') {
		return textCaretRect(element, point.offset) ?? edgeRect(element, 'start');
	}
	const node = $getNodeByKey(point.key);
	if (!$isElementNode(node)) {
		return null;
	}
	const before = node.getChildAtIndex(point.offset - 1);
	const beforeElement = before && editor.getElementByKey(before.getKey());
	if (beforeElement) {
		return edgeRect(beforeElement, 'end');
	}
	const after = node.getChildAtIndex(point.offset);
	const afterElement = after && editor.getElementByKey(after.getKey());
	return edgeRect(afterElement ?? element, 'start');
}

/**
 * Line drawn at the drop point while an image is dragged. The browser's own
 * drop caret is not available: it is only drawn when the page leaves the
 * dragover to the browser, which then does not dispatch the drop to the page.
 */
function createDropCaret(): {
	show: (rect: CaretRect, color: string) => void;
	hide: () => void;
} {
	let caret: HTMLDivElement | null = null;
	return {
		show: (rect, color): void => {
			if (caret === null) {
				caret = document.createElement('div');
				caret.dataset.testid = DROP_CARET_TEST_ID;
				caret.setAttribute('aria-hidden', 'true');
				Object.assign(caret.style, {
					position: 'fixed',
					width: '2px',
					pointerEvents: 'none',
					zIndex: '10000'
				});
				document.body.appendChild(caret);
			}
			Object.assign(caret.style, {
				left: `${rect.left - 1}px`,
				top: `${rect.top}px`,
				height: `${rect.height || 16}px`,
				backgroundColor: color
			});
		},
		hide: (): void => {
			caret?.remove();
			caret = null;
		}
	};
}

/**
 * Records the dragged image in the `DataTransfer`. Returns its key, or `null`
 * when the drag is not about an inline image.
 */
function $onImageDragStart(editor: LexicalEditor, event: DragEvent): NodeKey | null {
	const { target, dataTransfer } = event;
	if (!(target instanceof HTMLImageElement) || dataTransfer === null) {
		return null;
	}
	const node = $getNearestNodeFromDOMNode(target);
	if (!$isImageNode(node)) {
		return null;
	}
	const data: InlineImageDragData = { editorKey: editor.getKey(), nodeKey: node.getKey() };
	dataTransfer.setData(INLINE_IMAGE_DRAG_TYPE, JSON.stringify(data));
	dataTransfer.effectAllowed = 'move';
	return node.getKey();
}

/**
 * Moves the dragged image to the drop point: a copy of the image (same src,
 * cid, alt text, size and alignment) is inserted there and the original is
 * removed. Drops coming from another editor are ignored, as the image belongs
 * to (and its cid is tracked by) the source editor.
 */
function $moveImageToDropPoint(editor: LexicalEditor, event: DragEvent): void {
	const data = readInlineImageDragData(event.dataTransfer);
	if (data?.editorKey !== editor.getKey()) {
		return;
	}
	const image = $getNodeByKey(data.nodeKey);
	if (!$isImageNode(image)) {
		return;
	}
	const point = $resolveDropPoint(editor, event, image.getKey());
	if (point === null || !$selectDropPoint(point)) {
		return;
	}
	$insertNodes([
		$createImageNode(
			image.getSrc(),
			image.getCidUrl(),
			image.getAltText(),
			image.getWidth(),
			image.getHeight(),
			image.getAlignment()
		)
	]);
	image.remove();
}

/**
 * Lets an inline image be moved inside the editor by drag and drop. Lexical's
 * rich text handlers only take care of text range drags, so the image drag is
 * handled here, with a higher priority:
 *  - on dragstart the dragged image is recorded in the `DataTransfer`;
 *  - on dragover the drop is allowed and a caret is drawn at the drop point;
 *  - on drop the image is moved to the drop point.
 */
export function registerImageDragAndDrop(editor: LexicalEditor): () => void {
	const dropCaret = createDropCaret();
	// The image dragged from this editor. Kept here because, while dragging, the
	// browser does not expose the DataTransfer content (only its types) until the
	// drop.
	let draggedKey: NodeKey | null = null;

	const endDrag = (): void => {
		draggedKey = null;
		dropCaret.hide();
	};

	const onDragLeave = (event: DragEvent): void => {
		const root = editor.getRootElement();
		if (!(event.relatedTarget instanceof Node && root?.contains(event.relatedTarget))) {
			dropCaret.hide();
		}
	};

	return mergeRegister(
		editor.registerCommand(
			DRAGSTART_COMMAND,
			(event) => {
				draggedKey = $onImageDragStart(editor, event);
				return draggedKey !== null;
			},
			COMMAND_PRIORITY_HIGH
		),
		editor.registerCommand(
			DRAGOVER_COMMAND,
			(event) => {
				if (!isInlineImageDrag(event)) {
					return false;
				}
				// Always allow the drop, otherwise the browser handles it as a native
				// edit and the page does not receive the drop event
				event.preventDefault();
				// No caret for an image dragged from another editor: its drop is ignored
				const point = draggedKey && $resolveDropPoint(editor, event, draggedKey);
				const rect = point && $getDropPointRect(editor, point);
				const root = editor.getRootElement();
				if (rect && root) {
					dropCaret.show(rect, getComputedStyle(root).color);
				} else {
					dropCaret.hide();
				}
				return true;
			},
			COMMAND_PRIORITY_HIGH
		),
		editor.registerCommand(
			DROP_COMMAND,
			(event) => {
				if (!isInlineImageDrag(event)) {
					return false;
				}
				// Whatever happens next, the browser must not insert the dragged content
				event.preventDefault();
				endDrag();
				$moveImageToDropPoint(editor, event);
				return true;
			},
			COMMAND_PRIORITY_HIGH
		),
		editor.registerCommand(
			DRAGEND_COMMAND,
			() => {
				endDrag();
				return false;
			},
			COMMAND_PRIORITY_HIGH
		),
		editor.registerRootListener((root, previousRoot) => {
			previousRoot?.removeEventListener('dragleave', onDragLeave);
			root?.addEventListener('dragleave', onDragLeave);
		}),
		() => {
			editor.getRootElement()?.removeEventListener('dragleave', onDragLeave);
			endDrag();
		}
	);
}
