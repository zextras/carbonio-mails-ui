/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { fireEvent, waitFor } from '@testing-library/react';

import { setupTest, screen, within } from '@test-setup';
import { setupEditorStore } from '__test__/generators/editor-store';
import { generateNewMessageEditor } from 'store/editor/editor-generators';
import { useEditorsStore } from 'store/editor/store';
import { RichTextEditorContainer } from 'views/app/detail-panel/edit/editor/parts/rich-text-editor-container';

const CHEVRON_ICON = 'icon: ChevronDown';
const EDITOR_TESTID = 'edit-view-editor';

type TestUser = ReturnType<typeof setupTest>['user'];

function richTextOf(editorId: string): string {
	return useEditorsStore.getState().editors[editorId]?.text.richText ?? '';
}

/** Renders the editor and inserts a 2x2 table through the toolbar grid picker. */
async function setupEditorWithTable(): Promise<{
	editorId: string;
	user: TestUser;
	table: HTMLElement;
}> {
	const editor = generateNewMessageEditor();
	setupEditorStore({ editors: [editor] });
	const { user } = setupTest(<RichTextEditorContainer editorId={editor.id} onDragOver={vi.fn()} />);

	await user.click(screen.getByTestId(EDITOR_TESTID));
	await user.click(screen.getByRole('button', { name: 'lexical-label.table' }));
	await user.click(await screen.findByTestId('table-grid-cell-2-2'));

	const editorElement = screen.getByTestId(EDITOR_TESTID);
	const table = await within(editorElement).findByRole('table');
	return { editorId: editor.id, user, table };
}

/** Opens the floating per-cell action menu (anchored to the selected cell). */
async function openCellMenu(user: TestUser): Promise<void> {
	await user.click(await screen.findByRoleWithIcon('button', { icon: CHEVRON_ICON }));
}

/**
 * Returns the index of the table cell holding the caret. Focusing the content
 * editable (interacting with the portaled menu moved the focus out) makes
 * Lexical reconcile its tracked selection back into the DOM, where it can be
 * read from `window.getSelection()`.
 */
function caretCellIndex(table: HTMLElement): number {
	screen.getByTestId(EDITOR_TESTID).focus();
	const anchorNode = window.getSelection()?.anchorNode ?? null;
	return within(table)
		.getAllByRole('cell')
		.findIndex((cell) => anchorNode !== null && cell.contains(anchorNode));
}

describe('TableActionMenuPlugin', () => {
	it('inserts a column to the right', async () => {
		const { user, table } = await setupEditorWithTable();
		expect(within(table).getAllByRole('cell')).toHaveLength(4);

		await openCellMenu(user);
		await user.click(await screen.findByText('lexical-label.table_insert_column_right'));

		await waitFor(() => {
			expect(within(table).getAllByRole('cell')).toHaveLength(6);
		});
	});

	// The table is inserted with the caret in its first cell: after every
	// insertion the caret must still be in that same (possibly shifted) cell.
	it('keeps the caret in the original cell when inserting a column to the right', async () => {
		const { user, table } = await setupEditorWithTable();

		await openCellMenu(user);
		await user.click(await screen.findByText('lexical-label.table_insert_column_right'));
		await waitFor(() => {
			expect(within(table).getAllByRole('cell')).toHaveLength(6);
		});

		expect(caretCellIndex(table)).toBe(0);
	});

	it('keeps the caret in the original cell when inserting a column to the left', async () => {
		const { user, table } = await setupEditorWithTable();

		await openCellMenu(user);
		await user.click(await screen.findByText('lexical-label.table_insert_column_left'));
		await waitFor(() => {
			expect(within(table).getAllByRole('cell')).toHaveLength(6);
		});

		// The original cell is shifted right by the new column.
		expect(caretCellIndex(table)).toBe(1);
	});

	it('keeps the caret in the original cell when inserting a row above', async () => {
		const { user, table } = await setupEditorWithTable();

		await openCellMenu(user);
		await user.click(await screen.findByText('lexical-label.table_insert_row_above'));
		await waitFor(() => {
			expect(within(table).getAllByRole('row')).toHaveLength(3);
		});

		// The original cell is shifted down by the new row.
		expect(caretCellIndex(table)).toBe(2);
	});

	it('keeps the caret in the original cell when inserting a row below', async () => {
		const { user, table } = await setupEditorWithTable();

		await openCellMenu(user);
		await user.click(await screen.findByText('lexical-label.table_insert_row_below'));
		await waitFor(() => {
			expect(within(table).getAllByRole('row')).toHaveLength(3);
		});

		expect(caretCellIndex(table)).toBe(0);
	});

	it('deletes a row', async () => {
		const { user, table } = await setupEditorWithTable();
		expect(within(table).getAllByRole('row')).toHaveLength(2);

		await openCellMenu(user);
		await user.click(await screen.findByText('lexical-label.table_delete_row'));

		await waitFor(() => {
			expect(within(table).getAllByRole('row')).toHaveLength(1);
		});
	});

	it('deletes a column', async () => {
		const { user, table } = await setupEditorWithTable();
		expect(within(table).getAllByRole('cell')).toHaveLength(4);

		await openCellMenu(user);
		await user.click(await screen.findByText('lexical-label.table_delete_column'));

		await waitFor(() => {
			expect(within(table).getAllByRole('cell')).toHaveLength(2);
		});
	});

	it('deletes the whole table', async () => {
		const { user } = await setupEditorWithTable();
		const editorElement = screen.getByTestId(EDITOR_TESTID);

		await openCellMenu(user);
		await user.click(await screen.findByText('lexical-label.table_delete'));

		await waitFor(() => {
			expect(within(editorElement).queryByRole('table')).not.toBeInTheDocument();
		});
	});

	it('toggles the header row, turning the cell into a header cell', async () => {
		const { user, table } = await setupEditorWithTable();
		expect(within(table).queryByRole('columnheader')).not.toBeInTheDocument();

		await openCellMenu(user);
		await user.click(await screen.findByText('lexical-label.table_toggle_row_header'));

		expect(await within(table).findByRole('columnheader')).toBeInTheDocument();
	});

	it('sets the cell background color from the color picker', async () => {
		const { editorId, user } = await setupEditorWithTable();

		// The portal holding the chevron also holds the hidden color input, an
		// aria-hidden native input with no accessible query.
		await openCellMenu(user);
		// eslint-disable-next-line testing-library/no-node-access
		const colorInput = document.querySelector<HTMLInputElement>(
			'.mails-lexical-table-cell-action-button input[type="color"]'
		);
		if (colorInput === null) {
			throw new Error('cell background color input not found');
		}

		// eslint-disable-next-line testing-library/prefer-user-event -- native color input has no user-event equivalent
		fireEvent.change(colorInput, { target: { value: '#ff0000' } });

		await waitFor(() => {
			expect(richTextOf(editorId)).toContain('background-color: rgb(255, 0, 0)');
		});
	});

	it('does not offer the merge entry for a single selected cell', async () => {
		const { user } = await setupEditorWithTable();

		await openCellMenu(user);

		expect(await screen.findByText('lexical-label.table_insert_row_above')).toBeInTheDocument();
		expect(screen.queryByText('lexical-label.table_merge_cells')).not.toBeInTheDocument();
	});
});
