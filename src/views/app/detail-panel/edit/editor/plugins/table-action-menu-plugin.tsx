/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
	$deleteTableColumnAtSelection,
	$deleteTableRowAtSelection,
	$getTableCellNodeFromLexicalNode,
	$getTableNodeFromLexicalNodeOrThrow,
	$insertTableColumnAtSelection,
	$insertTableRowAtSelection,
	$isTableCellNode,
	$isTableSelection,
	$mergeCells,
	$unmergeCell,
	TableCellHeaderStates,
	type TableCellNode
} from '@lexical/table';
import { Button, Dropdown, type DropdownItem } from '@zextras/carbonio-design-system';
import { t } from '@zextras/carbonio-shell-ui';
import {
	$getNodeByKey,
	$getSelection,
	$isRangeSelection,
	type LexicalEditor,
	type NodeKey
} from 'lexical';
import { createPortal } from 'react-dom';

type CellMenuState = {
	cellKey: NodeKey;
	top: number;
	left: number;
	canUnmerge: boolean;
};

type CellMenuComputation = {
	menu: CellMenuState | null;
	selectedCellKeys: Array<NodeKey>;
};

/**
 * Within an editor read, derives the floating menu anchor for the cell holding
 * the current selection plus the keys of any cells in a multi-cell table
 * selection. Returns a `null` menu when the selection is not inside a cell.
 */
function $computeCellMenu(editor: LexicalEditor): CellMenuComputation {
	const selection = $getSelection();
	if (selection === null) {
		return { menu: null, selectedCellKeys: [] };
	}

	const isTableSelection = $isTableSelection(selection);
	const selectedCellKeys = isTableSelection
		? selection
				.getNodes()
				.filter($isTableCellNode)
				.map((cellNode) => cellNode.getKey())
		: [];

	// Anchor the menu on the cell holding the selection anchor. For a multi-cell
	// table selection `getNodes()[0]` is the TableNode (not a cell), so resolve
	// the anchor through the selection's anchor point instead.
	const anchorNode =
		isTableSelection || $isRangeSelection(selection)
			? selection.anchor.getNode()
			: (selection.getNodes()[0] ?? null);
	const cellNode = anchorNode ? $getTableCellNodeFromLexicalNode(anchorNode) : null;
	const cellElement = cellNode ? editor.getElementByKey(cellNode.getKey()) : null;
	const innerElement = editor.getRootElement()?.parentElement;
	if (cellNode === null || cellElement === null || !innerElement) {
		return { menu: null, selectedCellKeys };
	}

	const cellRect = cellElement.getBoundingClientRect();
	const innerRect = innerElement.getBoundingClientRect();
	return {
		menu: {
			cellKey: cellNode.getKey(),
			top: cellRect.top - innerRect.top,
			left: cellRect.right - innerRect.left,
			canUnmerge: cellNode.getColSpan() > 1 || cellNode.getRowSpan() > 1
		},
		selectedCellKeys
	};
}

/**
 * Collapses the selection to the start of the given cell and runs a table
 * utility on it. Must be called inside an `editor.update`.
 */
function $runOnActiveCell(cellKey: NodeKey, action: (cellNode: TableCellNode) => void): void {
	const cellNode = $getNodeByKey(cellKey);
	if ($isTableCellNode(cellNode)) {
		cellNode.selectStart();
		action(cellNode);
	}
}

/**
 * Applies a cell-level action to every given cell without collapsing the
 * selection, so a change made on a multi-cell selection affects them all. Must
 * be called inside an `editor.update`.
 */
function $forEachCell(cellKeys: Array<NodeKey>, action: (cellNode: TableCellNode) => void): void {
	cellKeys.forEach((cellKey) => {
		const cellNode = $getNodeByKey(cellKey);
		if ($isTableCellNode(cellNode)) {
			action(cellNode);
		}
	});
}

/**
 * Merges the cells of the live table selection, or, if it has already been
 * cleared, the cells captured from the last multi-cell selection. Must be called
 * inside an `editor.update`.
 */
function $mergeSelectedCells(fallbackKeys: Array<NodeKey>): void {
	const selection = $getSelection();
	const cells = $isTableSelection(selection)
		? selection.getNodes().filter($isTableCellNode)
		: fallbackKeys.map((key) => $getNodeByKey(key)).filter($isTableCellNode);
	if (cells.length > 1) {
		$mergeCells(cells);
		cells[0].selectStart();
	}
}

type TableMenuItemsParams = {
	runOnActiveCell: (action: (cellNode: TableCellNode) => void) => void;
	runOnSelectedCells: (action: (cellNode: TableCellNode) => void) => void;
	mergeSelectedCells: () => void;
	openColorPicker: () => void;
	canMerge: boolean;
	canUnmerge: boolean;
};

/**
 * Builds the dropdown entries for the cell action menu. Kept out of the
 * component so the conditional merge/unmerge entries do not inflate its
 * cognitive complexity.
 */
function buildTableMenuItems({
	runOnActiveCell,
	runOnSelectedCells,
	mergeSelectedCells,
	openColorPicker,
	canMerge,
	canUnmerge
}: TableMenuItemsParams): Array<DropdownItem> {
	const items: Array<DropdownItem> = [
		{
			id: 'insert-row-above',
			label: t('label.table_insert_row_above', 'Insert row above'),
			icon: 'PlusOutline',
			onClick: () => runOnActiveCell(() => $insertTableRowAtSelection(false))
		},
		{
			id: 'insert-row-below',
			label: t('label.table_insert_row_below', 'Insert row below'),
			icon: 'PlusOutline',
			onClick: () => runOnActiveCell(() => $insertTableRowAtSelection(true))
		},
		{
			id: 'insert-column-left',
			label: t('label.table_insert_column_left', 'Insert column left'),
			icon: 'PlusOutline',
			onClick: () => runOnActiveCell(() => $insertTableColumnAtSelection(false))
		},
		{
			id: 'insert-column-right',
			label: t('label.table_insert_column_right', 'Insert column right'),
			icon: 'PlusOutline',
			onClick: () => runOnActiveCell(() => $insertTableColumnAtSelection(true))
		},
		{ id: 'divider-1', type: 'divider' },
		{
			id: 'delete-row',
			label: t('label.table_delete_row', 'Delete row'),
			icon: 'Trash2Outline',
			onClick: () => runOnActiveCell(() => $deleteTableRowAtSelection())
		},
		{
			id: 'delete-column',
			label: t('label.table_delete_column', 'Delete column'),
			icon: 'Trash2Outline',
			onClick: () => runOnActiveCell(() => $deleteTableColumnAtSelection())
		},
		{
			id: 'delete-table',
			label: t('label.table_delete', 'Delete table'),
			icon: 'Trash2Outline',
			onClick: () =>
				runOnActiveCell((cellNode) => $getTableNodeFromLexicalNodeOrThrow(cellNode).remove())
		},
		{ id: 'divider-2', type: 'divider' },
		{
			id: 'toggle-row-header',
			label: t('label.table_toggle_row_header', 'Toggle header row'),
			onClick: () =>
				runOnSelectedCells((cellNode) => cellNode.toggleHeaderStyle(TableCellHeaderStates.ROW))
		},
		{
			id: 'toggle-column-header',
			label: t('label.table_toggle_column_header', 'Toggle header column'),
			onClick: () =>
				runOnSelectedCells((cellNode) => cellNode.toggleHeaderStyle(TableCellHeaderStates.COLUMN))
		},
		{ id: 'divider-3', type: 'divider' },
		{
			id: 'cell-background',
			label: t('label.table_cell_background', 'Cell background'),
			onClick: openColorPicker
		},
		{
			id: 'cell-background-clear',
			label: t('label.table_cell_background_clear', 'Clear background'),
			onClick: () => runOnSelectedCells((cellNode) => cellNode.setBackgroundColor(null))
		}
	];

	if (canMerge) {
		items.push(
			{ id: 'divider-merge', type: 'divider' },
			{
				id: 'merge-cells',
				label: t('label.table_merge_cells', 'Merge cells'),
				onClick: mergeSelectedCells
			}
		);
	}
	if (canUnmerge) {
		items.push({
			id: 'unmerge-cells',
			label: t('label.table_unmerge_cells', 'Unmerge cells'),
			onClick: () => runOnActiveCell(() => $unmergeCell())
		});
	}

	return items;
}

/**
 * Floating per-cell action menu: insert and
 * delete rows/columns, delete the table, toggle header row/column, set or clear
 * the cell background color, and merge/unmerge selected cells.
 *
 * A chevron button is anchored to the top-right of the cell that currently holds
 * the selection (portaled into the `.editor-inner` wrapper, which is positioned)
 * and opens a {@link Dropdown} with the available operations.
 */
export const TableActionMenuPlugin = (): React.JSX.Element | null => {
	const [editor] = useLexicalComposerContext();
	const [menu, setMenu] = useState<CellMenuState | null>(null);
	const [selectedCellKeys, setSelectedCellKeys] = useState<Array<NodeKey>>([]);
	const colorInputRef = useRef<HTMLInputElement>(null);
	// Cells the menu actions target: every cell of a multi-cell table selection,
	// or just the anchor cell otherwise. Held in a ref (and retained while the
	// menu is open) so actions still have the cells after interacting with the
	// (portaled) menu or the native color picker clears the live selection.
	const targetCellKeysRef = useRef<Array<NodeKey>>([]);

	const computeMenu = useCallback((): void => {
		if (!editor.isEditable()) {
			setMenu(null);
			setSelectedCellKeys([]);
			return;
		}
		const { menu: nextMenu, selectedCellKeys: cellKeys } = editor.read(() =>
			$computeCellMenu(editor)
		);
		setMenu(nextMenu);
		setSelectedCellKeys(cellKeys);
		// Keep the previous targets when the selection is momentarily lost (e.g.
		// the color picker is open and there is no menu to recompute from).
		if (nextMenu !== null) {
			targetCellKeysRef.current = cellKeys.length > 0 ? cellKeys : [nextMenu.cellKey];
		}
	}, [editor]);

	useEffect(() => {
		computeMenu();
		const unregister = editor.registerUpdateListener(() => computeMenu());
		const rootElement = editor.getRootElement();
		rootElement?.addEventListener('scroll', computeMenu);
		window.addEventListener('resize', computeMenu);
		return () => {
			unregister();
			rootElement?.removeEventListener('scroll', computeMenu);
			window.removeEventListener('resize', computeMenu);
		};
	}, [editor, computeMenu]);

	// Re-establish the selection inside the active cell before running a
	// selection-based table utility, since clicking the menu may move it.
	const runOnActiveCell = useCallback(
		(action: (cellNode: TableCellNode) => void): void => {
			const cellKey = menu?.cellKey;
			if (cellKey !== undefined) {
				editor.update(() => $runOnActiveCell(cellKey, action));
			}
		},
		[editor, menu]
	);

	// Apply a cell-level change to every targeted cell (the whole multi-cell
	// selection, or the single anchor cell), not just the first one.
	const runOnSelectedCells = useCallback(
		(action: (cellNode: TableCellNode) => void): void => {
			editor.update(() => $forEachCell(targetCellKeysRef.current, action));
		},
		[editor]
	);

	const onBackgroundColorSelected = useCallback(
		(event: React.ChangeEvent<HTMLInputElement>): void => {
			const { value } = event.target;
			runOnSelectedCells((cellNode) => cellNode.setBackgroundColor(value));
		},
		[runOnSelectedCells]
	);

	const mergeSelectedCells = useCallback((): void => {
		editor.update(() => $mergeSelectedCells(targetCellKeysRef.current));
	}, [editor]);

	const openColorPicker = useCallback((): void => {
		colorInputRef.current?.click();
	}, []);

	const items = useMemo<Array<DropdownItem>>(
		() =>
			buildTableMenuItems({
				runOnActiveCell,
				runOnSelectedCells,
				mergeSelectedCells,
				openColorPicker,
				canMerge: selectedCellKeys.length > 1,
				canUnmerge: menu?.canUnmerge ?? false
			}),
		[
			menu,
			mergeSelectedCells,
			openColorPicker,
			runOnActiveCell,
			runOnSelectedCells,
			selectedCellKeys.length
		]
	);

	const innerElement = editor.getRootElement()?.parentElement;
	if (menu === null || !innerElement) {
		return null;
	}

	return createPortal(
		<div
			className="mails-lexical-table-cell-action-button"
			style={{ top: menu.top, left: menu.left }}
		>
			<Dropdown items={items} placement="bottom-end">
				<Button
					icon="ChevronDown"
					type="ghost"
					size="small"
					color="text"
					onClick={(): void => undefined}
					// Keep the (table) selection alive while opening the menu: a plain
					// mousedown outside the contenteditable would collapse it, dropping
					// the multi-cell selection needed by merge.
					onMouseDown={(event: React.MouseEvent): void => event.preventDefault()}
				/>
			</Dropdown>
			<input
				ref={colorInputRef}
				type="color"
				style={{ display: 'none' }}
				onChange={onBackgroundColorSelected}
			/>
		</div>,
		innerElement
	);
};
