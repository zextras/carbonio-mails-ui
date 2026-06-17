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
import { Dropdown, type DropdownItem, IconButton } from '@zextras/carbonio-design-system';
import { t } from '@zextras/carbonio-shell-ui';
import { $getNodeByKey, $getSelection, type NodeKey } from 'lexical';
import { createPortal } from 'react-dom';

type CellMenuState = {
	cellKey: NodeKey;
	top: number;
	left: number;
	canUnmerge: boolean;
};

/**
 * Floating per-cell action menu giving TinyMCE-parity table editing: insert and
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

	const computeMenu = useCallback((): void => {
		if (!editor.isEditable()) {
			setMenu(null);
			setSelectedCellKeys([]);
			return;
		}
		editor.getEditorState().read(() => {
			const selection = $getSelection();
			if (selection === null) {
				setMenu(null);
				setSelectedCellKeys([]);
				return;
			}

			if ($isTableSelection(selection)) {
				const cellNodes = selection.getNodes().filter($isTableCellNode);
				setSelectedCellKeys(cellNodes.map((cellNode) => cellNode.getKey()));
			} else {
				setSelectedCellKeys([]);
			}

			const anchorNode = selection.getNodes()[0];
			const cellNode = anchorNode ? $getTableCellNodeFromLexicalNode(anchorNode) : null;
			if (cellNode === null) {
				setMenu(null);
				return;
			}

			const cellElement = editor.getElementByKey(cellNode.getKey());
			const innerElement = editor.getRootElement()?.parentElement;
			if (cellElement === null || !innerElement) {
				setMenu(null);
				return;
			}

			const cellRect = cellElement.getBoundingClientRect();
			const innerRect = innerElement.getBoundingClientRect();
			setMenu({
				cellKey: cellNode.getKey(),
				top: cellRect.top - innerRect.top,
				left: cellRect.right - innerRect.left,
				canUnmerge: cellNode.getColSpan() > 1 || cellNode.getRowSpan() > 1
			});
		});
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
			if (cellKey === undefined) {
				return;
			}
			editor.update(() => {
				const cellNode = $getNodeByKey(cellKey);
				if ($isTableCellNode(cellNode)) {
					cellNode.selectStart();
					action(cellNode);
				}
			});
		},
		[editor, menu]
	);

	const onBackgroundColorSelected = useCallback(
		(event: React.ChangeEvent<HTMLInputElement>): void => {
			const { value } = event.target;
			runOnActiveCell((cellNode) => cellNode.setBackgroundColor(value));
		},
		[runOnActiveCell]
	);

	const mergeSelectedCells = useCallback((): void => {
		editor.update(() => {
			const cells = selectedCellKeys.map((key) => $getNodeByKey(key)).filter($isTableCellNode);
			if (cells.length > 1) {
				$mergeCells(cells);
			}
		});
	}, [editor, selectedCellKeys]);

	const items = useMemo<Array<DropdownItem>>(() => {
		const base: Array<DropdownItem> = [
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
					runOnActiveCell((cellNode) => cellNode.toggleHeaderStyle(TableCellHeaderStates.ROW))
			},
			{
				id: 'toggle-column-header',
				label: t('label.table_toggle_column_header', 'Toggle header column'),
				onClick: () =>
					runOnActiveCell((cellNode) => cellNode.toggleHeaderStyle(TableCellHeaderStates.COLUMN))
			},
			{ id: 'divider-3', type: 'divider' },
			{
				id: 'cell-background',
				label: t('label.table_cell_background', 'Cell background'),
				onClick: () => colorInputRef.current?.click()
			},
			{
				id: 'cell-background-clear',
				label: t('label.table_cell_background_clear', 'Clear background'),
				onClick: () => runOnActiveCell((cellNode) => cellNode.setBackgroundColor(null))
			}
		];

		if (selectedCellKeys.length > 1) {
			base.push(
				{ id: 'divider-merge', type: 'divider' },
				{
					id: 'merge-cells',
					label: t('label.table_merge_cells', 'Merge cells'),
					onClick: mergeSelectedCells
				}
			);
		}
		if (menu?.canUnmerge) {
			base.push({
				id: 'unmerge-cells',
				label: t('label.table_unmerge_cells', 'Unmerge cells'),
				onClick: () => runOnActiveCell(() => $unmergeCell())
			});
		}

		return base;
	}, [menu, mergeSelectedCells, runOnActiveCell, selectedCellKeys.length]);

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
				<IconButton icon="ChevronDown" size="small" onClick={(): void => undefined} />
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
