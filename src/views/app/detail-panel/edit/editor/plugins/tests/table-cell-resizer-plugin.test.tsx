/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
/* eslint-disable max-classes-per-file -- two minimal Event stubs cover a jsdom gap (see below) */
import React from 'react';

import { fireEvent, waitFor } from '@testing-library/react';

import { setupTest, screen, within } from '@test-setup';
import { setupEditorStore } from '__test__/generators/editor-store';
import { generateNewMessageEditor } from 'store/editor/editor-generators';
import { useEditorsStore } from 'store/editor/store';
import { RichTextEditorContainer } from 'views/app/detail-panel/edit/editor/parts/rich-text-editor-container';

type TestUser = ReturnType<typeof setupTest>['user'];

const COLUMN_RESIZE_HANDLE_NAME = 'lexical-label.table_resize_column';
const EDITOR_TESTID = 'edit-view-editor';
const RESIZED_WIDTH_STYLE = 'width: 200px';

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

// jsdom (20) implements neither DragEvent nor ClipboardEvent, yet Lexical's
// default paste handler does `instanceof` checks against both. Two distinct
// no-op Event subclasses stand in so the checks resolve (rather than throwing a
// ReferenceError) and the synthetic paste event is classified as a clipboard
// paste, not a drag.
class StubDragEvent extends Event {}
class StubClipboardEvent extends Event {}

/**
 * Dispatches a synthetic paste event carrying HTML, as produced by e.g. Excel:
 * a `<colgroup>` pins each column's width, mirroring real clipboard HTML where
 * not every `<td>` also repeats an inline width.
 */
function pasteHtml(target: HTMLElement, html: string): void {
	// eslint-disable-next-line testing-library/prefer-user-event
	fireEvent.paste(target, {
		clipboardData: {
			items: [],
			files: [],
			getData: (type: string): string => (type === 'text/html' ? html : ''),
			types: ['text/html']
		}
	});
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

	await user.click(screen.getByTestId(EDITOR_TESTID));
	await user.click(screen.getByRole('button', { name: 'lexical-label.table' }));
	await user.click(await screen.findByTestId('table-grid-cell-2-2'));

	const editorElement = screen.getByTestId(EDITOR_TESTID);
	const table = await within(editorElement).findByRole('table');
	const cells = within(table).getAllByRole('cell');
	return { editorId: editor.id, user, cells };
}

describe('TableCellResizerPlugin', () => {
	const globalScope = globalThis as Record<string, unknown>;
	const originalDragEvent = globalScope.DragEvent;
	const originalClipboardEvent = globalScope.ClipboardEvent;
	beforeAll(() => {
		globalScope.DragEvent = originalDragEvent ?? StubDragEvent;
		globalScope.ClipboardEvent = originalClipboardEvent ?? StubClipboardEvent;
	});
	afterAll(() => {
		globalScope.DragEvent = originalDragEvent;
		globalScope.ClipboardEvent = originalClipboardEvent;
	});

	it('shows the column and row resize handles when a cell is hovered', async () => {
		const { cells } = await setupEditorWithTable();

		hoverCell(cells[0]);

		expect(
			await screen.findByRole('button', { name: COLUMN_RESIZE_HANDLE_NAME })
		).toBeInTheDocument();
		expect(
			screen.getByRole('button', { name: 'lexical-label.table_resize_row' })
		).toBeInTheDocument();
	});

	it('persists the new column width after dragging the column handle', async () => {
		const { editorId, cells } = await setupEditorWithTable();

		hoverCell(cells[0]);
		const columnHandle = await screen.findByRole('button', {
			name: COLUMN_RESIZE_HANDLE_NAME
		});

		/* eslint-disable testing-library/prefer-user-event -- simulating a pointer drag with explicit coordinates */
		fireEvent.mouseDown(columnHandle, { clientX: 0, clientY: 0 });
		fireEvent.mouseMove(document, { clientX: 200, clientY: 0 });
		fireEvent.mouseUp(document, { clientX: 200, clientY: 0 });
		/* eslint-enable testing-library/prefer-user-event */

		await waitFor(() => {
			expect(richTextOf(editorId)).toContain(RESIZED_WIDTH_STYLE);
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

	it('resizes a column of a pasted table whose width comes from a <colgroup>, e.g. from Excel', async () => {
		const editor = generateNewMessageEditor();
		editor.text = { plainText: '', richText: '<p></p>' };
		setupEditorStore({ editors: [editor] });
		setupTest(<RichTextEditorContainer editorId={editor.id} onDragOver={vi.fn()} />);

		const editorElement = screen.getByTestId(EDITOR_TESTID);
		pasteHtml(
			editorElement,
			'<table><colgroup><col style="width:80px"><col style="width:160px"></colgroup>' +
				'<tbody><tr><td style="width:80px">A</td><td>B</td></tr></tbody></table>'
		);

		const table = await within(editorElement).findByRole('table');
		const cells = within(table).getAllByRole('cell');

		hoverCell(cells[0]);
		const columnHandle = await screen.findByRole('button', {
			name: COLUMN_RESIZE_HANDLE_NAME
		});

		/* eslint-disable testing-library/prefer-user-event -- simulating a pointer drag with explicit coordinates */
		fireEvent.mouseDown(columnHandle, { clientX: 0, clientY: 0 });
		fireEvent.mouseMove(document, { clientX: 200, clientY: 0 });
		fireEvent.mouseUp(document, { clientX: 200, clientY: 0 });
		/* eslint-enable testing-library/prefer-user-event */

		await waitFor(() => {
			const html = richTextOf(editor.id);
			const doc = new DOMParser().parseFromString(html, 'text/html');
			// eslint-disable-next-line testing-library/no-node-access -- parsing the exported HTML string, not the rendered DOM
			const resizedCol = doc.querySelectorAll('colgroup col')[0];
			// Before the fix this stayed at the original "80px" from the pasted
			// <colgroup>, since only the <td> width (not the column's) was updated.
			expect(resizedCol?.getAttribute('style')).toContain(RESIZED_WIDTH_STYLE);
		});
	});

	it('does not collapse the other columns of a plain (non-pasted) table when one column is resized', async () => {
		const { editorId, cells } = await setupEditorWithTable();

		hoverCell(cells[0]);
		const columnHandle = await screen.findByRole('button', {
			name: COLUMN_RESIZE_HANDLE_NAME
		});

		/* eslint-disable testing-library/prefer-user-event -- simulating a pointer drag with explicit coordinates */
		fireEvent.mouseDown(columnHandle, { clientX: 0, clientY: 0 });
		fireEvent.mouseMove(document, { clientX: 200, clientY: 0 });
		fireEvent.mouseUp(document, { clientX: 200, clientY: 0 });
		/* eslint-enable testing-library/prefer-user-event */

		// Wait for the resize itself to actually land before inspecting the
		// sibling column — otherwise this check can race ahead of the
		// `editor.update` and read the pre-drag DOM.
		await waitFor(() => {
			expect(richTextOf(editorId)).toContain(RESIZED_WIDTH_STYLE);
		});

		const doc = new DOMParser().parseFromString(richTextOf(editorId), 'text/html');
		// eslint-disable-next-line testing-library/no-node-access -- parsing the exported HTML string, not the rendered DOM
		const otherCol = doc.querySelectorAll('colgroup col')[1];
		// This table never had any explicit column width, so the second
		// column must not be forced down to the resizer's MIN_COLUMN_WIDTH.
		expect(otherCol?.getAttribute('style') ?? '').not.toContain('width: 40px');
	});
});
