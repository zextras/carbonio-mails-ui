/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
	$computeTableMapSkipCellCheck,
	$isTableNode,
	$isTableRowNode,
	getTableElement,
	type TableNode
} from '@lexical/table';
import { t } from '@zextras/carbonio-shell-ui';
import {
	$getNearestNodeFromDOMNode,
	$getNodeByKey,
	type LexicalEditor,
	type NodeKey
} from 'lexical';
import { createPortal } from 'react-dom';

import {
	$applyColumnWidths,
	$getColumnWidths,
	$getRenderedColumnWidths,
	MIN_COLUMN_WIDTH,
	MIN_ROW_HEIGHT,
	scaleSizes,
	sum
} from './table-resize-helpers';

/** Pointer movements along one axis smaller than this are not a resize of that dimension. */
const DRAG_THRESHOLD_PX = 4;

/** A box relative to the editor wrapper the handle and the outline are positioned in. */
type Box = {
	top: number;
	left: number;
	width: number;
	height: number;
};

type Size = Pick<Box, 'width' | 'height'>;

type DragState = {
	tableKey: NodeKey;
	startX: number;
	startY: number;
	startBox: Box;
	minimumSize: Size;
};

function measureBox(element: HTMLElement, container: HTMLElement): Box {
	const rect = element.getBoundingClientRect();
	const containerRect = container.getBoundingClientRect();
	return {
		top: rect.top - containerRect.top,
		left: rect.left - containerRect.left,
		width: rect.width,
		height: rect.height
	};
}

function $getTableNode(tableKey: NodeKey): TableNode | null {
	const node = $getNodeByKey(tableKey);
	return $isTableNode(node) ? node : null;
}

/** The `<table>` element of the table node `tableKey`, while it is in the editor. */
function getTableElementByKey(editor: LexicalEditor, tableKey: NodeKey): HTMLElement | null {
	return editor.read(() => {
		const tableNode = $getTableNode(tableKey);
		return tableNode ? getTableElement(tableNode, editor.getElementByKey(tableKey)) : null;
	});
}

/**
 * The key of the table under the pointer. Only the `<table>` of a table node of
 * this editor counts, not one outside the editor or one that no table node renders.
 */
function getHoveredTableKey(editor: LexicalEditor, event: MouseEvent): NodeKey | null {
	const tableElement =
		event.target instanceof Element ? event.target.closest<HTMLElement>('table') : null;
	if (!tableElement || !editor.getRootElement()?.contains(tableElement)) {
		return null;
	}
	return editor.read(() => {
		const node = $getNearestNodeFromDOMNode(tableElement);
		return $isTableNode(node) ? node.getKey() : null;
	});
}

/** The size of the table with every column and row at its minimum. */
function $getMinimumSize(tableNode: TableNode): Size {
	return {
		width: MIN_COLUMN_WIDTH * tableNode.getColumnCount(),
		height: MIN_ROW_HEIGHT * tableNode.getChildren().filter($isTableRowNode).length
	};
}

/** The box the table has when the pointer is at (`clientX`, `clientY`) during `drag`. */
function boxAt(drag: DragState, clientX: number, clientY: number): Box {
	return {
		...drag.startBox,
		width: Math.max(drag.minimumSize.width, drag.startBox.width + clientX - drag.startX),
		height: Math.max(drag.minimumSize.height, drag.startBox.height + clientY - drag.startY)
	};
}

/**
 * Follows the pointer on the whole document until the button is released, also
 * outside the editor. Escape, or the window losing the focus (the release would
 * then never come, and the next click would end the drag where nobody meant to),
 * cancels the drag. Returns a function that stops following the pointer.
 */
function trackPointerDrag(handlers: {
	onMove: (event: MouseEvent) => void;
	onEnd: (event: MouseEvent) => void;
	onCancel: () => void;
}): () => void {
	const removers: Array<() => void> = [];
	const listen = (
		target: EventTarget,
		type: string,
		listener: (event: Event) => void,
		capture = false
	): void => {
		target.addEventListener(type, listener, capture);
		removers.push(() => target.removeEventListener(type, listener, capture));
	};
	const stop = (): void => removers.splice(0).forEach((remove) => remove());
	const finish = (callback: () => void): void => {
		stop();
		callback();
	};
	listen(document, 'mousemove', (event) => handlers.onMove(event as MouseEvent));
	// The drag started with the main button: releasing another one does not end it.
	listen(document, 'mouseup', (event) => {
		if ((event as MouseEvent).button === 0) {
			finish(() => handlers.onEnd(event as MouseEvent));
		}
	});
	listen(
		document,
		'keydown',
		(event) => {
			if ((event as KeyboardEvent).key === 'Escape') {
				event.preventDefault();
				event.stopPropagation();
				finish(handlers.onCancel);
			}
		},
		true
	);
	listen(window, 'blur', () => finish(handlers.onCancel));
	return stop;
}

/**
 * Grows or shrinks the table by (`deltaX`, `deltaY`) by scaling every column
 * width and row height by the same ratio, starting from the size they have on
 * screen: what the user sees and drags, which can differ a lot from the widths
 * stored in the model (e.g. a pasted table 100% wide with <colgroup> widths, or
 * an imported one whose content is wider than its declared cell widths).
 *
 * Columns and rows are measured without the borders and the spacing around the
 * cells, which the table keeps: dragging the corner by `deltaX` makes the columns
 * that much wider in total, so the table ends where the outline is also when its
 * cells are spaced. When the columns cannot all be measured (no layout, or a
 * column covered only by cells spanning more columns), the widths stored in the
 * model are scaled to the width the table had when the drag started (`startBox`)
 * plus `deltaX`. A dimension that was not dragged is left as it is, so a
 * horizontal drag does not pin the height of the rows.
 */
function $resizeTable(
	editor: LexicalEditor,
	tableNode: TableNode,
	startBox: Box,
	deltaX: number,
	deltaY: number
): void {
	if (deltaX !== 0) {
		const [tableMap] = $computeTableMapSkipCellCheck(tableNode, null, null);
		const renderedWidths = $getRenderedColumnWidths(editor, tableNode, tableMap);
		const colWidths = renderedWidths ?? $getColumnWidths(editor, tableNode, tableMap);
		const startWidth = renderedWidths ? sum(renderedWidths) : startBox.width || sum(colWidths);
		const newColWidths = scaleSizes(colWidths, startWidth + deltaX, MIN_COLUMN_WIDTH);
		if (newColWidths) {
			$applyColumnWidths(
				tableNode,
				tableMap,
				newColWidths,
				newColWidths.map((_, index) => index)
			);
		}
	}
	if (deltaY !== 0) {
		const rows = tableNode.getChildren().filter($isTableRowNode);
		const rowHeights = rows.map((row) =>
			Math.round(
				editor.getElementByKey(row.getKey())?.getBoundingClientRect().height ||
					row.getHeight() ||
					MIN_ROW_HEIGHT
			)
		);
		const newRowHeights = scaleSizes(rowHeights, sum(rowHeights) + deltaY, MIN_ROW_HEIGHT);
		newRowHeights?.forEach((height, index) => rows[index].setHeight(height));
	}
}

/**
 * The movement of the pointer along one axis, or 0 when it is so small it is
 * only the hand shaking while dragging along the other axis: the handle is on a
 * corner, and that dimension would otherwise be pinned for nothing (a fluid
 * table would get a fixed width, every row a fixed height).
 */
const intendedDelta = (delta: number): number => (Math.abs(delta) < DRAG_THRESHOLD_PX ? 0 : delta);

/**
 * Applies the drag in a single `editor.update`. A click that did not move the
 * pointer changes nothing, so it does not dirty the draft or add an undo step.
 */
function commitDrag(editor: LexicalEditor, drag: DragState, endX: number, endY: number): void {
	const deltaX = intendedDelta(endX - drag.startX);
	const deltaY = intendedDelta(endY - drag.startY);
	if ((deltaX === 0 && deltaY === 0) || !editor.isEditable()) {
		return;
	}
	editor.update(() => {
		const tableNode = $getTableNode(drag.tableKey);
		if (tableNode) {
			$resizeTable(editor, tableNode, drag.startBox, deltaX, deltaY);
		}
	});
}

const getInnerElement = (editor: LexicalEditor): HTMLElement | null =>
	editor.getRootElement()?.parentElement ?? null;

/**
 * The table under the pointer and where its box is, while no drag is in
 * progress, kept up to date when the table changes size (typing, a row or column
 * inserted, the resize itself, ...) and dropped when the table is removed.
 */
function useHoveredTable(
	editor: LexicalEditor,
	isDragging: () => boolean,
	dragging: boolean
): { tableKey: NodeKey | null; handleBox: Box | null } {
	const [tableKey, setTableKey] = useState<NodeKey | null>(null);
	const [handleBox, setHandleBox] = useState<Box | null>(null);

	const showHandle = useCallback(
		(key: NodeKey | null): void => {
			const innerElement = getInnerElement(editor);
			const tableElement = key === null ? null : getTableElementByKey(editor, key);
			const visible = innerElement !== null && tableElement !== null;
			setTableKey(visible ? key : null);
			setHandleBox(visible ? measureBox(tableElement, innerElement) : null);
		},
		[editor]
	);

	const onPointerMove = useCallback(
		(event: MouseEvent): void => {
			if (!isDragging() && editor.isEditable()) {
				showHandle(getHoveredTableKey(editor, event));
			}
		},
		[editor, isDragging, showHandle]
	);

	useEffect(
		() =>
			editor.registerRootListener((rootElement, prevRootElement) => {
				prevRootElement?.removeEventListener('mousemove', onPointerMove);
				rootElement?.addEventListener('mousemove', onPointerMove);
			}),
		[editor, onPointerMove]
	);

	useEffect(
		() =>
			editor.registerUpdateListener(() => {
				if (tableKey !== null && !isDragging()) {
					showHandle(tableKey);
				}
			}),
		[editor, isDragging, showHandle, tableKey]
	);

	// Updates are ignored during a drag, and a drag can end without one (cancelled,
	// or the table removed meanwhile): check the table again when it ends.
	const wasDraggingRef = useRef(false);
	useEffect(() => {
		if (wasDraggingRef.current && !dragging) {
			showHandle(tableKey);
		}
		wasDraggingRef.current = dragging;
	}, [dragging, showHandle, tableKey]);

	// A read-only editor (e.g. a disabled signature) offers no resize.
	useEffect(
		() =>
			editor.registerEditableListener((editable) => {
				if (!editable) {
					showHandle(null);
				}
			}),
		[editor, showHandle]
	);

	return { tableKey, handleBox };
}

/**
 * The drag of the corner handle: `startDrag` starts it from the handle of a
 * table, `outline` is the box the table gets while it is in progress.
 */
function useCornerDrag(editor: LexicalEditor): {
	outline: Box | null;
	isDragging: () => boolean;
	startDrag: (event: React.MouseEvent, tableKey: NodeKey | null) => void;
} {
	const [outline, setOutline] = useState<Box | null>(null);
	const dragRef = useRef<DragState | null>(null);
	const stopDragRef = useRef<(() => void) | null>(null);

	// A drag still in progress when the editor goes away must not leave listeners
	// on the document.
	useEffect(() => (): void => stopDragRef.current?.(), []);

	const isDragging = useCallback((): boolean => dragRef.current !== null, []);

	const startDrag = useCallback(
		(event: React.MouseEvent, tableKey: NodeKey | null): void => {
			const innerElement = getInnerElement(editor);
			const tableElement = tableKey === null ? null : getTableElementByKey(editor, tableKey);
			if (
				event.button !== 0 ||
				!editor.isEditable() ||
				tableKey === null ||
				!innerElement ||
				!tableElement
			) {
				return;
			}
			const minimumSize = editor.read(() => {
				const tableNode = $getTableNode(tableKey);
				return tableNode ? $getMinimumSize(tableNode) : null;
			});
			if (minimumSize === null) {
				return;
			}
			event.preventDefault();
			event.stopPropagation();
			const drag: DragState = {
				tableKey,
				startX: event.clientX,
				startY: event.clientY,
				startBox: measureBox(tableElement, innerElement),
				minimumSize
			};
			dragRef.current = drag;
			setOutline(drag.startBox);
			const endDrag = (): void => {
				dragRef.current = null;
				stopDragRef.current = null;
				setOutline(null);
			};
			stopDragRef.current = trackPointerDrag({
				onMove: (moveEvent) => setOutline(boxAt(drag, moveEvent.clientX, moveEvent.clientY)),
				onEnd: (upEvent) => {
					endDrag();
					commitDrag(editor, drag, upEvent.clientX, upEvent.clientY);
				},
				onCancel: endDrag
			});
		},
		[editor]
	);

	return { outline, isDragging, startDrag };
}

/**
 * Adds a handle on the bottom-right corner of the table under the pointer.
 * Dragging it shows an outline of the new size; on mouse up a single
 * `editor.update` scales every column width and row height proportionally so the
 * whole table ends up at the dragged size (no mid-drag updates, so the
 * change/save pipeline is not flooded). Columns never shrink below
 * MIN_COLUMN_WIDTH nor rows below MIN_ROW_HEIGHT, and the outline stops there too.
 *
 * While dragging, a transparent overlay covers the page: the pointer keeps the
 * resize cursor and does not reach the editor, whose column/row handles and "+"
 * buttons would otherwise follow it.
 */
export const TableCornerResizerPlugin = (): React.JSX.Element | null => {
	const [editor] = useLexicalComposerContext();
	const { outline, isDragging, startDrag } = useCornerDrag(editor);
	const { tableKey, handleBox } = useHoveredTable(editor, isDragging, outline !== null);

	const innerElement = getInnerElement(editor);
	if (!innerElement) {
		return null;
	}

	const label = t('lexical-label.table_resize', 'Resize table');
	return createPortal(
		<>
			{handleBox !== null && outline === null && (
				<button
					type="button"
					className="mails-lexical-table-corner-resizer"
					aria-label={label}
					title={label}
					style={{ top: handleBox.top + handleBox.height, left: handleBox.left + handleBox.width }}
					onMouseDown={(event): void => startDrag(event, tableKey)}
				/>
			)}
			{outline !== null && (
				<>
					<div className="mails-lexical-table-corner-resizer-overlay" />
					<div
						className="mails-lexical-table-corner-resizer-outline"
						data-testid="table-corner-resizer-outline"
						style={{
							top: outline.top,
							left: outline.left,
							width: outline.width,
							height: outline.height
						}}
					/>
				</>
			)}
		</>,
		innerElement
	);
};
