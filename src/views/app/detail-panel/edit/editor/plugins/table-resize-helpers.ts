/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { getCSSFromStyleObject } from '@lexical/selection';
import { type TableMapType, type TableMapValueType, type TableNode } from '@lexical/table';
import { getStyleObjectFromCSS, type LexicalEditor } from 'lexical';

export const MIN_COLUMN_WIDTH = 40;
export const MIN_ROW_HEIGHT = 24;

const TABLE_WIDTH_PROPERTIES = new Set(['width', 'table-layout']);

export const sum = (values: ReadonlyArray<number>): number =>
	values.reduce((total, value) => total + value, 0);

const isUsableWidth = (width: number | undefined): width is number =>
	width !== undefined && Number.isFinite(width) && width > 0;

/**
 * The distinct cells covering `columnIndex`, in row order. A cell spanning more
 * rows appears once.
 */
export function cellsOfColumn(
	tableMap: TableMapType,
	columnIndex: number
): Array<TableMapValueType> {
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
 * A stored width that is not a finite number (a pasted `<col width>` of
 * hundreds of digits is read as an infinite one) is ignored like a missing one.
 */
export function $getColumnWidths(
	editor: LexicalEditor,
	tableNode: TableNode,
	tableMap: TableMapType
): Array<number> {
	const existingColWidths = tableNode.getColWidths();
	return Array.from({ length: tableNode.getColumnCount() }, (_, index) => {
		const existingWidth = existingColWidths?.[index];
		if (isUsableWidth(existingWidth)) {
			return existingWidth;
		}
		const cells = cellsOfColumn(tableMap, index).map(({ cell }) => cell);
		const singleColumnCells = cells.filter((cell) => cell.getColSpan() === 1);
		const cellWidth = singleColumnCells.find((cell) => isUsableWidth(cell.getWidth()))?.getWidth();
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
 * The width each column has on screen, measured on a cell covering only that
 * column. `null` when the table is not laid out or a column is only covered by
 * cells spanning more columns: mixing measured and stored widths would distort
 * the proportions, so the caller then falls back to {@link $getColumnWidths}.
 */
export function $getRenderedColumnWidths(
	editor: LexicalEditor,
	tableNode: TableNode,
	tableMap: TableMapType
): Array<number> | null {
	const widths = Array.from({ length: tableNode.getColumnCount() }, (_, index) => {
		const cell = cellsOfColumn(tableMap, index).find(
			(value) => value.cell.getColSpan() === 1
		)?.cell;
		const element = cell ? editor.getElementByKey(cell.getKey()) : null;
		return element?.getBoundingClientRect().width ?? 0;
	});
	return widths.every((width) => isUsableWidth(width)) ? widths : null;
}

/**
 * Returns `style` with its `width` and `table-layout` declarations replaced so
 * the table is exactly `widthPx` wide (an auto-layout table would instead widen
 * to fit its content), keeping every other declaration.
 */
export function withTableWidth(style: string, widthPx: number): string {
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
 * Gives the table the column widths `colWidths` and makes it as wide as their
 * sum. The cells covering one of `changedColumns` follow: a cell covering only
 * that column gets its width, a cell spanning more columns that declares a width
 * gets the sum of the columns it spans.
 *
 * The table must be as wide as its columns: the theme stylesheet makes it 100%
 * wide, and with "table-layout: fixed" the browser would rescale the columns to
 * fill it, so the columns could neither shrink nor grow the table.
 *
 * Nothing changes when a width is not a finite number, as the one read from a
 * pasted `<col width>` of hundreds of digits: it would end up in the message.
 */
export function $applyColumnWidths(
	tableNode: TableNode,
	tableMap: TableMapType,
	colWidths: ReadonlyArray<number>,
	changedColumns: ReadonlyArray<number>
): void {
	if (!colWidths.every((width) => Number.isFinite(width))) {
		return;
	}
	const seen = new Set<string>();
	changedColumns
		.flatMap((columnIndex) => cellsOfColumn(tableMap, columnIndex))
		.forEach(({ cell, startColumn }) => {
			if (seen.has(cell.getKey())) {
				return;
			}
			seen.add(cell.getKey());
			if (cell.getColSpan() === 1) {
				cell.setWidth(colWidths[startColumn]);
			} else if (cell.getWidth()) {
				cell.setWidth(sum(colWidths.slice(startColumn, startColumn + cell.getColSpan())));
			}
		});
	tableNode.setColWidths([...colWidths]);
	tableNode.setStyle(withTableWidth(tableNode.getStyle(), sum(colWidths)));
}

/**
 * Scales `sizes` by the same ratio so that they add up to `total`, none of them
 * going below `min` (the total is then larger). Returns `null` when the sizes
 * cannot be scaled: they add up to nothing, or a value is not a finite number.
 */
export function scaleSizes(
	sizes: ReadonlyArray<number>,
	total: number,
	min: number
): Array<number> | null {
	const current = sum(sizes);
	if (!Number.isFinite(current) || current <= 0 || !Number.isFinite(total)) {
		return null;
	}
	// The ratio first: `size * target` could overflow to Infinity on its own.
	const ratio = Math.max(min * sizes.length, total) / current;
	const scaled = sizes.map((size) => Math.max(min, Math.round(size * ratio)));
	return scaled.every((size) => Number.isFinite(size)) ? scaled : null;
}
