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
import { RichTextEditorContainer } from 'views/app/detail-panel/edit/editor/parts/rich-text-editor-container';

const ADD_ROW_LABEL = 'label.table_add_row';
const ADD_COLUMN_LABEL = 'label.table_add_column';

type TestUser = ReturnType<typeof setupTest>['user'];

/**
 * The hover affordance is driven by raw `mousemove` events on a specific cell,
 * which `userEvent` cannot target precisely, so the pointer is simulated with
 * `fireEvent`.
 */
function hoverCell(cell: HTMLElement): void {
	// eslint-disable-next-line testing-library/prefer-user-event
	fireEvent.mouseMove(cell);
}

/** Renders the editor and inserts a 2x2 table through the toolbar grid picker. */
async function setupEditorWithTable(): Promise<{
	user: TestUser;
	table: HTMLTableElement;
	cells: Array<HTMLElement>;
}> {
	const editor = generateNewMessageEditor();
	setupEditorStore({ editors: [editor] });
	const { user } = setupTest(<RichTextEditorContainer editorId={editor.id} onDragOver={vi.fn()} />);

	await user.click(screen.getByTestId('edit-view-editor'));
	await user.click(screen.getByRole('button', { name: 'label.table' }));
	await user.click(await screen.findByTestId('table-grid-cell-2-2'));

	const editorElement = screen.getByTestId('edit-view-editor');
	const table = (await within(editorElement).findByRole('table')) as HTMLTableElement;
	// Row-major order for a 2x2 table: [r0c0, r0c1, r1c0, r1c1].
	const cells = within(table).getAllByRole('cell');
	return { user, table, cells };
}

describe('TableHoverActionsPlugin', () => {
	it('does not show any hover affordance before hovering a table cell', async () => {
		await setupEditorWithTable();

		expect(screen.queryByRole('button', { name: ADD_ROW_LABEL })).not.toBeInTheDocument();
		expect(screen.queryByRole('button', { name: ADD_COLUMN_LABEL })).not.toBeInTheDocument();
	});

	it('appends a row when hovering a last-row cell and clicking the add-row button', async () => {
		const { user, table, cells } = await setupEditorWithTable();
		expect(within(table).getAllByRole('row')).toHaveLength(2);

		// cells[2] is in the last row (bottom-left).
		hoverCell(cells[2]);

		const addRowButton = await screen.findByRole('button', { name: ADD_ROW_LABEL });
		await user.click(addRowButton);

		await waitFor(() => {
			expect(within(table).getAllByRole('row')).toHaveLength(3);
		});
	});

	it('appends a column when hovering a last-column cell and clicking the add-column button', async () => {
		const { user, table, cells } = await setupEditorWithTable();
		expect(within(table).getAllByRole('cell')).toHaveLength(4);

		// cells[1] is in the last column but not the last row (top-right).
		hoverCell(cells[1]);

		const addColumnButton = await screen.findByRole('button', { name: ADD_COLUMN_LABEL });
		await user.click(addColumnButton);

		await waitFor(() => {
			expect(within(table).getAllByRole('cell')).toHaveLength(6);
		});
	});

	it('hides the hover affordance when the pointer leaves the table cells', async () => {
		const { table, cells } = await setupEditorWithTable();

		hoverCell(cells[2]);
		await screen.findByRole('button', { name: ADD_ROW_LABEL });

		// Moving onto the table element itself (outside any td/th) clears it.
		hoverCell(table);

		await waitFor(() => {
			expect(screen.queryByRole('button', { name: ADD_ROW_LABEL })).not.toBeInTheDocument();
		});
	});
});
