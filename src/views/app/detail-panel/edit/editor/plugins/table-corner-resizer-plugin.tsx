/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
	$computeTableMapSkipCellCheck,
	$getTableNodeFromLexicalNodeOrThrow,
	$isTableRowNode
} from '@lexical/table';
import { t } from '@zextras/carbonio-shell-ui';
import { $getNearestNodeFromDOMNode, type LexicalEditor } from 'lexical';
import { createPortal } from 'react-dom';

import {
	$applyColWidths,
	$resolveColWidths,
	MIN_COLUMN_WIDTH,
	MIN_ROW_HEIGHT
} from './table-resize-helpers';

type TableRect = {
	top: number;
	left: number;
	width: number;
	height: number;
};

type DragState = {
	tableElement: HTMLElement;
	startX: number;
	startY: number;
	startRect: TableRect;
};

function measure(tableElement: HTMLElement, innerElement: HTMLElement): TableRect {
	const tableRect = tableElement.getBoundingClientRect();
	const innerRect = innerElement.getBoundingClientRect();
	return {
		top: tableRect.top - innerRect.top,
		left: tableRect.left - innerRect.left,
		width: tableRect.width,
		height: tableRect.height
	};
}

/**
 * Grows or shrinks the table by (`deltaX`, `deltaY`) relative to `startRect` by
 * scaling every column width and row height by the same ratio. When the layout
 * is not measurable (zero-sized rect) the size stored in the model is used as
 * the starting size.
 */
function $scaleTable(
	editor: LexicalEditor,
	tableElement: HTMLElement,
	startRect: TableRect,
	deltaX: number,
	deltaY: number
): void {
	const node = $getNearestNodeFromDOMNode(tableElement);
	if (node === null) {
		return;
	}
	const tableNode = $getTableNodeFromLexicalNodeOrThrow(node);
	const [tableMap] = $computeTableMapSkipCellCheck(tableNode, null, null);

	const colWidths = $resolveColWidths(editor, tableNode, tableMap);
	const modelWidth = colWidths.reduce((total, width) => total + width, 0);
	if (modelWidth > 0) {
		const targetWidth = Math.max(
			MIN_COLUMN_WIDTH * colWidths.length,
			(startRect.width || modelWidth) + deltaX
		);
		$applyColWidths(
			tableNode,
			tableMap,
			colWidths.map((width) =>
				Math.max(MIN_COLUMN_WIDTH, Math.round((width * targetWidth) / modelWidth))
			)
		);
	}

	const rows = tableNode.getChildren().filter($isTableRowNode);
	const rowHeights = rows.map((row) =>
		Math.round(
			editor.getElementByKey(row.getKey())?.getBoundingClientRect().height ||
				row.getHeight() ||
				MIN_ROW_HEIGHT
		)
	);
	const modelHeight = rowHeights.reduce((total, height) => total + height, 0);
	if (modelHeight > 0) {
		const targetHeight = Math.max(
			MIN_ROW_HEIGHT * rows.length,
			(startRect.height || modelHeight) + deltaY
		);
		rows.forEach((row, index) => {
			row.setHeight(
				Math.max(MIN_ROW_HEIGHT, Math.round((rowHeights[index] * targetHeight) / modelHeight))
			);
		});
	}
}

/**
 * Adds a handle on the bottom-right corner of the table under the pointer.
 * Dragging it shows an outline of the new size; on mouse up a single
 * `editor.update` scales every column width and row height proportionally so the
 * whole table ends up at the dragged size (no mid-drag updates, so the
 * change/save pipeline is not flooded). Columns never shrink below
 * MIN_COLUMN_WIDTH nor rows below MIN_ROW_HEIGHT.
 */
export const TableCornerResizerPlugin = (): React.JSX.Element | null => {
	const [editor] = useLexicalComposerContext();
	const [tableElement, setTableElement] = useState<HTMLElement | null>(null);
	const [rect, setRect] = useState<TableRect | null>(null);
	const [outline, setOutline] = useState<TableRect | null>(null);
	const dragRef = useRef<DragState | null>(null);

	const getInnerElement = useCallback(
		(): HTMLElement | null => editor.getRootElement()?.parentElement ?? null,
		[editor]
	);

	const refreshRect = useCallback(
		(element: HTMLElement | null): void => {
			const innerElement = getInnerElement();
			setRect(element?.isConnected && innerElement ? measure(element, innerElement) : null);
		},
		[getInnerElement]
	);

	const onPointerMove = useCallback(
		(event: MouseEvent): void => {
			if (dragRef.current !== null || !editor.isEditable()) {
				return;
			}
			const element = (event.target as HTMLElement | null)?.closest?.('table') ?? null;
			setTableElement(element);
			refreshRect(element);
		},
		[editor, refreshRect]
	);

	useEffect(
		() =>
			editor.registerRootListener((rootElement, prevRootElement) => {
				prevRootElement?.removeEventListener('mousemove', onPointerMove);
				rootElement?.addEventListener('mousemove', onPointerMove);
			}),
		[editor, onPointerMove]
	);

	// Keep the handle attached to the table when its size changes (typing, row
	// or column insertion, ...) and drop it when the table is removed.
	useEffect(
		() =>
			editor.registerUpdateListener(() => {
				if (dragRef.current === null) {
					refreshRect(tableElement);
				}
			}),
		[editor, refreshRect, tableElement]
	);

	const onDragMove = useCallback((event: MouseEvent): void => {
		const drag = dragRef.current;
		if (drag === null) {
			return;
		}
		setOutline({
			...drag.startRect,
			width: Math.max(MIN_COLUMN_WIDTH, drag.startRect.width + event.clientX - drag.startX),
			height: Math.max(MIN_ROW_HEIGHT, drag.startRect.height + event.clientY - drag.startY)
		});
	}, []);

	const onDragEnd = useCallback(
		(event: MouseEvent): void => {
			const drag = dragRef.current;
			document.removeEventListener('mousemove', onDragMove);
			document.removeEventListener('mouseup', onDragEnd);
			dragRef.current = null;
			setOutline(null);
			if (drag === null) {
				return;
			}

			editor.update(() =>
				$scaleTable(
					editor,
					drag.tableElement,
					drag.startRect,
					event.clientX - drag.startX,
					event.clientY - drag.startY
				)
			);
		},
		[editor, onDragMove]
	);

	const startDrag = useCallback(
		(event: React.MouseEvent): void => {
			const innerElement = getInnerElement();
			if (tableElement === null || !innerElement) {
				return;
			}
			event.preventDefault();
			event.stopPropagation();
			const startRect = measure(tableElement, innerElement);
			dragRef.current = {
				tableElement,
				startX: event.clientX,
				startY: event.clientY,
				startRect
			};
			setOutline(startRect);
			document.addEventListener('mousemove', onDragMove);
			document.addEventListener('mouseup', onDragEnd);
		},
		[getInnerElement, onDragEnd, onDragMove, tableElement]
	);

	const innerElement = getInnerElement();
	if (!innerElement) {
		return null;
	}

	return createPortal(
		<>
			{rect !== null && outline === null && (
				<button
					type="button"
					className="mails-lexical-table-corner-resizer"
					aria-label={t('lexical-label.table_resize', 'Resize table')}
					style={{ top: rect.top + rect.height, left: rect.left + rect.width }}
					onMouseDown={startDrag}
				/>
			)}
			{outline !== null && (
				<div
					className="mails-lexical-table-corner-resizer-outline"
					style={{
						top: outline.top,
						left: outline.left,
						width: outline.width,
						height: outline.height
					}}
				/>
			)}
		</>,
		innerElement
	);
};
