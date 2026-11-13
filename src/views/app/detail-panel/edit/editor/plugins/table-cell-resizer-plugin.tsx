/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { getCSSFromStyleObject } from '@lexical/selection';
import {
	$computeTableMap,
	$getTableCellNodeFromLexicalNode,
	$getTableNodeFromLexicalNodeOrThrow,
	$getTableRowNodeFromTableCellNodeOrThrow,
	$isTableCellNode,
	getDOMCellFromTarget,
	TableCellNode,
	TableMapType,
	TableMapValueType,
	TableNode
} from '@lexical/table';
import { t } from '@zextras/carbonio-shell-ui';
import { $getNearestNodeFromDOMNode, getStyleObjectFromCSS, LexicalEditor } from 'lexical';
import { createPortal } from 'react-dom';

const MIN_COLUMN_WIDTH = 40;
const MIN_ROW_HEIGHT = 24;

const TABLE_WIDTH_PROPERTIES = new Set(['width', 'table-layout']);

const sum = (values: ReadonlyArray<number>): number =>
	values.reduce((total, value) => total + value, 0);

/**
 * The distinct cells covering `columnIndex`, in row order. A cell spanning more
 * rows appears once.
 */
function cellsOfColumn(tableMap: TableMapType, columnIndex: number): Array<TableMapValueType> {
	const seen = new Set<string>();
	return tableMap.flatMap((row) => {
		const value = row[columnIndex];
		if (!value || seen.has(value.cell.getKey())) {
			return [];
		}
		seen.add(value.cell.getKey());
		return [value];
	});
}

/**
 * The width of each column. Tables pasted from sources like Excel define them
 * via <colgroup><col>, which "table-layout: fixed" prioritizes over the <td>
 * width; otherwise the width of a cell covering only that column is used, and
 * then its on-screen width: defaulting to MIN_COLUMN_WIDTH would visibly
 * collapse the column, since most tables (anything not pasted with per-cell
 * widths) have no colWidths/cell width to fall back on. A cell spanning more
 * columns doesn't tell the width of each one, so it is only the last resort.
 */
function $getColumnWidths(
	editor: LexicalEditor,
	tableNode: TableNode,
	tableMap: TableMapType
): Array<number> {
	const existingColWidths = tableNode.getColWidths();
	return Array.from({ length: tableNode.getColumnCount() }, (_, index) => {
		const existingWidth = existingColWidths?.[index];
		if (existingWidth) {
			return existingWidth;
		}
		const cells = cellsOfColumn(tableMap, index).map(({ cell }) => cell);
		const singleColumnCells = cells.filter((cell) => cell.getColSpan() === 1);
		const cellWidth = singleColumnCells.find((cell) => cell.getWidth())?.getWidth();
		if (cellWidth) {
			return cellWidth;
		}
		const measuredCell = singleColumnCells[0] ?? cells[0];
		const measuredElement = measuredCell ? editor.getElementByKey(measuredCell.getKey()) : null;
		return measuredElement
			? Math.round(measuredElement.getBoundingClientRect().width / measuredCell.getColSpan())
			: MIN_COLUMN_WIDTH;
	});
}

/**
 * Returns `style` with its `width` and `table-layout` declarations replaced so
 * the table is exactly `widthPx` wide (an auto-layout table would instead widen
 * to fit its content), keeping every other declaration.
 */
function withTableWidth(style: string, widthPx: number): string {
	const others = Object.entries(getStyleObjectFromCSS(style)).filter(
		([property]) => !TABLE_WIDTH_PROPERTIES.has(property.toLowerCase())
	);
	return getCSSFromStyleObject({
		...Object.fromEntries(others),
		width: `${widthPx}px`,
		'table-layout': 'fixed'
	});
}

/**
 * Gives the column whose right border is at `cellNode` (its last one, when the
 * cell spans more columns) the width the user dragged it to. The table is then
 * as wide as the sum of its columns: the theme stylesheet makes it 100% wide,
 * and with "table-layout: fixed" the browser would rescale the columns to fill
 * it, so the drag could neither shrink nor grow the table.
 */
function $resizeColumn(
	editor: LexicalEditor,
	cellNode: TableCellNode,
	startCellWidth: number,
	delta: number
): void {
	const tableNode = $getTableNodeFromLexicalNodeOrThrow(cellNode);
	const [tableMap, { startColumn }] = $computeTableMap(tableNode, cellNode, cellNode);
	const columnIndex = startColumn + cellNode.getColSpan() - 1;
	const colWidths = $getColumnWidths(editor, tableNode, tableMap);
	if (columnIndex >= colWidths.length) {
		return;
	}
	// The other columns the cell spans keep their width.
	const startWidth = startCellWidth - sum(colWidths.slice(startColumn, columnIndex));
	const newWidth = Math.max(MIN_COLUMN_WIDTH, Math.round(startWidth + delta));
	const newColWidths = colWidths.map((width, index) => (index === columnIndex ? newWidth : width));

	cellsOfColumn(tableMap, columnIndex).forEach(({ cell, startColumn: cellStartColumn }) => {
		if (cell.getColSpan() === 1) {
			cell.setWidth(newWidth);
		} else if (cell.getWidth()) {
			cell.setWidth(sum(newColWidths.slice(cellStartColumn, cellStartColumn + cell.getColSpan())));
		}
	});
	tableNode.setColWidths(newColWidths);
	tableNode.setStyle(withTableWidth(tableNode.getStyle(), sum(newColWidths)));
}

type HoveredCell = {
	cellElement: HTMLElement;
	top: number;
	left: number;
	width: number;
	height: number;
};

type DragState = {
	direction: 'column' | 'row';
	startCoordinate: number;
	startSize: number;
	cellElement: HTMLElement;
};

type Guide = {
	direction: 'column' | 'row';
	position: number;
};

/**
 * Adds drag handles on the right (column) and bottom (row) borders of the cell
 * under the pointer. Dragging shows a guide line; the new size is persisted with
 * a single `editor.update` on mouse up (so the column/row resize does not flood
 * the change/save pipeline mid-drag). Columns resize uniformly across all rows.
 */
export const TableCellResizerPlugin = (): React.JSX.Element | null => {
	const [editor] = useLexicalComposerContext();
	const [hoveredCell, setHoveredCell] = useState<HoveredCell | null>(null);
	const [guide, setGuide] = useState<Guide | null>(null);
	const dragRef = useRef<DragState | null>(null);

	const getInnerElement = useCallback(
		(): HTMLElement | null => editor.getRootElement()?.parentElement ?? null,
		[editor]
	);

	const onPointerMove = useCallback(
		(event: MouseEvent): void => {
			if (dragRef.current !== null || !editor.isEditable()) {
				return;
			}
			const innerElement = getInnerElement();
			const cell = getDOMCellFromTarget(event.target as Node);
			if (cell === null || !innerElement) {
				setHoveredCell(null);
				return;
			}
			const cellRect = cell.elem.getBoundingClientRect();
			const innerRect = innerElement.getBoundingClientRect();
			setHoveredCell({
				cellElement: cell.elem,
				top: cellRect.top - innerRect.top,
				left: cellRect.left - innerRect.left,
				width: cellRect.width,
				height: cellRect.height
			});
		},
		[editor, getInnerElement]
	);

	useEffect(
		() =>
			editor.registerRootListener((rootElement, prevRootElement) => {
				prevRootElement?.removeEventListener('mousemove', onPointerMove);
				rootElement?.addEventListener('mousemove', onPointerMove);
			}),
		[editor, onPointerMove]
	);

	const onDragMove = useCallback(
		(event: MouseEvent): void => {
			const drag = dragRef.current;
			const innerElement = getInnerElement();
			if (drag === null || !innerElement) {
				return;
			}
			const innerRect = innerElement.getBoundingClientRect();
			setGuide({
				direction: drag.direction,
				position:
					drag.direction === 'column'
						? event.clientX - innerRect.left
						: event.clientY - innerRect.top
			});
		},
		[getInnerElement]
	);

	const onDragEnd = useCallback(
		(event: MouseEvent): void => {
			const drag = dragRef.current;
			document.removeEventListener('mousemove', onDragMove);
			document.removeEventListener('mouseup', onDragEnd);
			dragRef.current = null;
			setGuide(null);
			setHoveredCell(null);
			if (drag === null) {
				return;
			}

			editor.update(() => {
				const node = $getNearestNodeFromDOMNode(drag.cellElement);
				const cellNode = node ? $getTableCellNodeFromLexicalNode(node) : null;
				if (!$isTableCellNode(cellNode)) {
					return;
				}
				if (drag.direction === 'column') {
					$resizeColumn(editor, cellNode, drag.startSize, event.clientX - drag.startCoordinate);
				} else {
					const newHeight = Math.max(
						MIN_ROW_HEIGHT,
						Math.round(drag.startSize + (event.clientY - drag.startCoordinate))
					);
					$getTableRowNodeFromTableCellNodeOrThrow(cellNode).setHeight(newHeight);
				}
			});
		},
		[editor, onDragMove]
	);

	const startDrag = useCallback(
		(direction: 'column' | 'row', event: React.MouseEvent): void => {
			if (hoveredCell === null) {
				return;
			}
			event.preventDefault();
			dragRef.current = {
				direction,
				startCoordinate: direction === 'column' ? event.clientX : event.clientY,
				startSize: direction === 'column' ? hoveredCell.width : hoveredCell.height,
				cellElement: hoveredCell.cellElement
			};
			const innerElement = getInnerElement();
			const innerRect = innerElement?.getBoundingClientRect();
			setGuide({
				direction,
				position:
					direction === 'column'
						? event.clientX - (innerRect?.left ?? 0)
						: event.clientY - (innerRect?.top ?? 0)
			});
			document.addEventListener('mousemove', onDragMove);
			document.addEventListener('mouseup', onDragEnd);
		},
		[getInnerElement, hoveredCell, onDragEnd, onDragMove]
	);

	const innerElement = getInnerElement();
	if (!innerElement) {
		return null;
	}

	return createPortal(
		<>
			{hoveredCell !== null && guide === null && (
				<>
					<button
						type="button"
						className="mails-lexical-table-resizer mails-lexical-table-resizer-column"
						aria-label={t('lexical-label.table_resize_column', 'Resize column')}
						style={{
							top: hoveredCell.top,
							left: hoveredCell.left + hoveredCell.width,
							height: hoveredCell.height
						}}
						onMouseDown={(event): void => startDrag('column', event)}
					/>
					<button
						type="button"
						className="mails-lexical-table-resizer mails-lexical-table-resizer-row"
						aria-label={t('lexical-label.table_resize_row', 'Resize row')}
						style={{
							top: hoveredCell.top + hoveredCell.height,
							left: hoveredCell.left,
							width: hoveredCell.width
						}}
						onMouseDown={(event): void => startDrag('row', event)}
					/>
				</>
			)}
			{guide !== null && (
				<div
					className={`mails-lexical-table-resizer-guide mails-lexical-table-resizer-guide-${guide.direction}`}
					style={guide.direction === 'column' ? { left: guide.position } : { top: guide.position }}
				/>
			)}
		</>,
		innerElement
	);
};
