/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { type TableMapType, type TableNode } from '@lexical/table';
import { type LexicalEditor } from 'lexical';

export const MIN_COLUMN_WIDTH = 40;
export const MIN_ROW_HEIGHT = 24;

/**
 * Returns the current width of every column of the table. Tables pasted from
 * sources like Excel define widths via <colgroup><col>, which the
 * "table-layout: fixed" CSS rule prioritizes over <td> width, so
 * TableNode.colWidths must be kept in sync with every resize. Columns without a
 * stored width fall back to the first cell width and finally to the on-screen
 * width — leaving them unset would default them to MIN_COLUMN_WIDTH and visibly
 * collapse them, since most tables (anything not pasted with per-cell widths)
 * have no existing colWidths/cell width.
 */
export function $resolveColWidths(
	editor: LexicalEditor,
	tableNode: TableNode,
	tableMap: TableMapType
): Array<number> {
	const existingColWidths = tableNode.getColWidths();
	return Array.from({ length: tableNode.getColumnCount() }, (_, index) => {
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

/**
 * Returns `style` with its `width` and `table-layout` declarations replaced so
 * the table is exactly `widthPx` wide (an auto-layout table would instead widen
 * to fit its content), keeping every other declaration (e.g. ones carried by an
 * imported table).
 */
export function withTableWidth(style: string, widthPx: number): string {
	const others = style
		.split(';')
		.map((declaration) => declaration.trim())
		.filter((declaration) => declaration !== '' && !/^(width|table-layout)\s*:/i.test(declaration));
	return [...others, `width: ${widthPx}px`, 'table-layout: fixed'].join('; ').concat(';');
}

/**
 * Writes `colWidths` to the table node, to every cell of each column and pins
 * the table width to their sum.
 */
export function $applyColWidths(
	tableNode: TableNode,
	tableMap: TableMapType,
	colWidths: Array<number>
): void {
	colWidths.forEach((width, columnIndex) => {
		tableMap.forEach((row) => {
			row[columnIndex]?.cell.setWidth(width);
		});
	});
	tableNode.setColWidths(colWidths);
	// The stylesheet forces `width: 100%` on tables, and with `table-layout:
	// fixed` the browser then rescales the columns to fill it, so shrinking a
	// column (or the last one) would have no effect. Pin the table to the sum
	// of its columns so it grows and shrinks with them.
	tableNode.setStyle(
		withTableWidth(
			tableNode.getStyle(),
			colWidths.reduce((total, width) => total + width, 0)
		)
	);
}
