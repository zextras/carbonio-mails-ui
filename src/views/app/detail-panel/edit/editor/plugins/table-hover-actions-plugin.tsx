/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
	$getTableColumnIndexFromTableCellNode,
	$getTableNodeFromLexicalNodeOrThrow,
	$getTableRowIndexFromTableCellNode,
	$insertTableColumnAtSelection,
	$insertTableRowAtSelection,
	$isTableCellNode,
	$isTableRowNode,
	getTableElement
} from '@lexical/table';
import { t } from '@zextras/carbonio-shell-ui';
import { $getNearestNodeFromDOMNode, type LexicalEditor } from 'lexical';
import { createPortal } from 'react-dom';

const BUTTON_THICKNESS_PX = 20;

type HoverAction = {
	type: 'row' | 'column';
	top: number;
	left: number;
	width: number;
	height: number;
};

/**
 * Computes, within an editor read, whether the hovered cell sits on the last row
 * or last column of its table and, if so, the position of the corresponding
 * "add" button relative to `innerElement`. Returns `null` otherwise.
 */
function $readHoverAction(
	editor: LexicalEditor,
	cellElement: HTMLElement,
	innerElement: HTMLElement
): HoverAction | null {
	const cellNode = $getNearestNodeFromDOMNode(cellElement);
	if (!$isTableCellNode(cellNode)) {
		return null;
	}
	const tableNode = $getTableNodeFromLexicalNodeOrThrow(cellNode);
	const tableElement = getTableElement(tableNode, editor.getElementByKey(tableNode.getKey()));
	if (tableElement === null) {
		return null;
	}

	const rowCount = tableNode.getChildrenSize();
	const firstRow = tableNode.getFirstChild();
	const columnCount = $isTableRowNode(firstRow) ? firstRow.getChildrenSize() : 0;
	const tableRect = tableElement.getBoundingClientRect();
	const innerRect = innerElement.getBoundingClientRect();

	if ($getTableRowIndexFromTableCellNode(cellNode) === rowCount - 1) {
		return {
			type: 'row',
			top: tableRect.bottom - innerRect.top,
			left: tableRect.left - innerRect.left,
			width: tableRect.width,
			height: BUTTON_THICKNESS_PX
		};
	}
	if ($getTableColumnIndexFromTableCellNode(cellNode) === columnCount - 1) {
		return {
			type: 'column',
			top: tableRect.top - innerRect.top,
			left: tableRect.right - innerRect.left,
			width: BUTTON_THICKNESS_PX,
			height: tableRect.height
		};
	}
	return null;
}

/**
 * Anchors the selection to the end of the hovered cell and appends a row below
 * (or a column to the right), so the new row/column lands at the table edge.
 */
function $insertAtTableEdge(cellElement: HTMLElement, type: 'row' | 'column'): void {
	const cellNode = $getNearestNodeFromDOMNode(cellElement);
	if (!$isTableCellNode(cellNode)) {
		return;
	}
	cellNode.selectEnd();
	if (type === 'row') {
		$insertTableRowAtSelection(true);
	} else {
		$insertTableColumnAtSelection(true);
	}
}

/**
 * Reproduces the Lexical playground "hover to add" affordance: when the pointer
 * is over a cell of the last row a full-width button appears under the table to
 * append a row, and over a cell of the last column a full-height button appears
 * to the right to append a column. Clicking inserts at the end of the table.
 *
 * The button is portaled into the positioned `.editor-inner` wrapper (the same
 * target used by the cell action menu and resizer plugins), so its coordinates
 * are computed relative to that element.
 */
export const TableHoverActionsPlugin = (): React.JSX.Element | null => {
	const [editor] = useLexicalComposerContext();
	const [hoverAction, setHoverAction] = useState<HoverAction | null>(null);
	// DOM node of the hovered cell, used to anchor the Lexical selection right
	// before inserting so the new row/column lands at the correct table edge.
	const hoveredCellDOMRef = useRef<HTMLElement | null>(null);

	const getInnerElement = useCallback(
		(): HTMLElement | null => editor.getRootElement()?.parentElement ?? null,
		[editor]
	);

	const onPointerMove = useCallback(
		(event: MouseEvent): void => {
			if (!editor.isEditable()) {
				return;
			}
			const { target } = event;
			const innerElement = getInnerElement();
			const cellElement =
				target instanceof HTMLElement ? target.closest<HTMLElement>('td, th') : null;
			if (cellElement === null || !innerElement) {
				setHoverAction(null);
				hoveredCellDOMRef.current = null;
				return;
			}
			hoveredCellDOMRef.current = cellElement;
			// `editor.read` (not `editorState.read`) sets the active editor, which the
			// DOM-based helpers used below (`$getNearestNodeFromDOMNode`) require.
			setHoverAction(editor.read(() => $readHoverAction(editor, cellElement, innerElement)));
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

	const insert = useCallback(
		(type: 'row' | 'column'): void => {
			const cellElement = hoveredCellDOMRef.current;
			if (cellElement === null) {
				return;
			}
			editor.update(() => $insertAtTableEdge(cellElement, type));
			setHoverAction(null);
		},
		[editor]
	);

	const innerElement = getInnerElement();
	if (hoverAction === null || !innerElement) {
		return null;
	}

	const label =
		hoverAction.type === 'row'
			? t('lexical-label.table_add_row', 'Add row')
			: t('lexical-label.table_add_column', 'Add column');

	return createPortal(
		<button
			type="button"
			className={`mails-lexical-table-hover-action mails-lexical-table-hover-action-${hoverAction.type}`}
			aria-label={label}
			title={label}
			style={{
				top: hoverAction.top,
				left: hoverAction.left,
				width: hoverAction.width,
				height: hoverAction.height
			}}
			onClick={(): void => insert(hoverAction.type)}
		>
			+
		</button>,
		innerElement
	);
};
