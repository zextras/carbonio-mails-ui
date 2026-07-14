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

type TestUser = ReturnType<typeof setupTest>['user'];

function richTextOf(editorId: string): string {
	return useEditorsStore.getState().editors[editorId]?.text.richText ?? '';
}

/**
 * The resize handles appear in response to a raw `mousemove` over a specific
 * cell, which `userEvent` cannot target precisely, so the pointer is simulated
 * with `fireEvent`.
 */
function hoverCell(cell: HTMLElement): void {
	// eslint-disable-next-line testing-library/prefer-user-event
	fireEvent.mouseMove(cell);
}

/** Renders the editor and inserts a 2x2 table through the toolbar grid picker. */
async function setupEditorWithTable(): Promise<{
	editorId: string;
	user: TestUser;
	cells: Array<HTMLElement>;
}> {
	const editor = generateNewMessageEditor();
	setupEditorStore({ editors: [editor] });
	const { user } = setupTest(<RichTextEditorContainer editorId={editor.id} onDragOver={vi.fn()} />);

	await user.click(screen.getByTestId('edit-view-editor'));
	await user.click(screen.getByRole('button', { name: 'lexical-label.table' }));
	await user.click(await screen.findByTestId('table-grid-cell-2-2'));

	const editorElement = screen.getByTestId('edit-view-editor');
	const table = await within(editorElement).findByRole('table');
	const cells = within(table).getAllByRole('cell');
	return { editorId: editor.id, user, cells };
}

describe('TableCellResizerPlugin', () => {
	it('shows the column and row resize handles when a cell is hovered', async () => {
		const { cells } = await setupEditorWithTable();

		hoverCell(cells[0]);

		expect(
			await screen.findByRole('button', { name: 'lexical-label.table_resize_column' })
		).toBeInTheDocument();
		expect(
			screen.getByRole('button', { name: 'lexical-label.table_resize_row' })
		).toBeInTheDocument();
	});

	it('persists the new column width after dragging the column handle', async () => {
		const { editorId, cells } = await setupEditorWithTable();

		hoverCell(cells[0]);
		const columnHandle = await screen.findByRole('button', {
			name: 'lexical-label.table_resize_column'
		});

		/* eslint-disable testing-library/prefer-user-event -- simulating a pointer drag with explicit coordinates */
		fireEvent.mouseDown(columnHandle, { clientX: 0, clientY: 0 });
		fireEvent.mouseMove(document, { clientX: 200, clientY: 0 });
		fireEvent.mouseUp(document, { clientX: 200, clientY: 0 });
		/* eslint-enable testing-library/prefer-user-event */

		await waitFor(() => {
			expect(richTextOf(editorId)).toContain('width: 200px');
		});
	});

	it('persists the new row height after dragging the row handle', async () => {
		const { editorId, cells } = await setupEditorWithTable();

		hoverCell(cells[0]);
		const rowHandle = await screen.findByRole('button', { name: 'lexical-label.table_resize_row' });

		/* eslint-disable testing-library/prefer-user-event -- simulating a pointer drag with explicit coordinates */
		fireEvent.mouseDown(rowHandle, { clientX: 0, clientY: 0 });
		fireEvent.mouseMove(document, { clientX: 0, clientY: 120 });
		fireEvent.mouseUp(document, { clientX: 0, clientY: 120 });
		/* eslint-enable testing-library/prefer-user-event */

		await waitFor(() => {
			expect(richTextOf(editorId)).toContain('height: 120px');
		});
	});
});
