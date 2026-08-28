/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
	$computeTableMap,
	$getTableCellNodeFromLexicalNode,
	$getTableColumnIndexFromTableCellNode,
	$getTableNodeFromLexicalNodeOrThrow,
	$getTableRowNodeFromTableCellNodeOrThrow,
	$isTableCellNode,
	getDOMCellFromTarget,
	TableMapType,
	TableNode
} from '@lexical/table';
import { t } from '@zextras/carbonio-shell-ui';
import { $getNearestNodeFromDOMNode, LexicalEditor } from 'lexical';
import { createPortal } from 'react-dom';

const MIN_COLUMN_WIDTH = 40;
const MIN_ROW_HEIGHT = 24;

/**
 * Tables pasted from sources like Excel define widths via <colgroup><col>,
 * which the "table-layout: fixed" CSS rule prioritizes over <td> width. Keeps
 * TableNode.colWidths in sync with the resized column so the drag is actually
 * reflected, while every other column keeps its current on-screen width —
 * leaving it unset would default it to MIN_COLUMN_WIDTH and visibly collapse
 * it, since most tables (anything not pasted with per-cell widths) have no
 * existing colWidths/cell width to fall back on.
 */
function computeColWidthsAfterColumnResize(
	editor: LexicalEditor,
	tableNode: TableNode,
	tableMap: TableMapType,
	columnIndex: number,
	newWidth: number
): Array<number> {
	const existingColWidths = tableNode.getColWidths();
	return Array.from({ length: tableNode.getColumnCount() }, (_, index) => {
		if (index === columnIndex) {
			return newWidth;
		}
		const existingWidth =
			existingColWidths?.[index] ??
			tableMap.reduce<number | undefined>(
				(found, row) => found ?? row[index]?.cell.getWidth(),
				undefined
			);
		if (existingWidth) {
			return existingWidth;
		}
		const columnCellKey = tableMap[0]?.[index]?.cell.getKey();
		const columnElement = columnCellKey ? editor.getElementByKey(columnCellKey) : null;
		return columnElement
			? Math.round(columnElement.getBoundingClientRect().width)
			: MIN_COLUMN_WIDTH;
	});
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
					const newWidth = Math.max(
						MIN_COLUMN_WIDTH,
						Math.round(drag.startSize + (event.clientX - drag.startCoordinate))
					);
					const tableNode = $getTableNodeFromLexicalNodeOrThrow(cellNode);
					const columnIndex = $getTableColumnIndexFromTableCellNode(cellNode);
					const [tableMap] = $computeTableMap(tableNode, cellNode, cellNode);
					const newColWidths = computeColWidthsAfterColumnResize(
						editor,
						tableNode,
						tableMap,
						columnIndex,
						newWidth
					);
					tableMap.forEach((row) => {
						row[columnIndex]?.cell.setWidth(newWidth);
					});
					tableNode.setColWidths(newColWidths);
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
