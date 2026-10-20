/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
/* eslint-disable max-classes-per-file -- two minimal Event stubs cover a jsdom gap (see below) */
/* eslint-disable testing-library/no-node-access -- parses the exported HTML string, not the rendered DOM */
import React from 'react';

import { fireEvent, waitFor } from '@testing-library/react';

import { setupTest, screen, within } from '@test-setup';
import { setupEditorStore } from '__test__/generators/editor-store';
import { generateNewMessageEditor } from 'store/editor/editor-generators';
import { useEditorsStore } from 'store/editor/store';
import { RichTextEditorContainer } from 'views/app/detail-panel/edit/editor/parts/rich-text-editor-container';

const CORNER_HANDLE_NAME = 'lexical-label.table_resize';
const EDITOR_TESTID = 'edit-view-editor';
// Pasted <colgroup> widths: 80px + 160px.
const PASTED_TABLE =
	'<table><colgroup><col style="width:80px"><col style="width:160px"></colgroup>' +
	'<tbody><tr><td style="width:80px">A</td><td>B</td></tr></tbody></table>';

// jsdom (20) implements neither DragEvent nor ClipboardEvent, yet Lexical's
// default paste handler does `instanceof` checks against both.
class StubDragEvent extends Event {}
class StubClipboardEvent extends Event {}

function richTextOf(editorId: string): string {
	return useEditorsStore.getState().editors[editorId]?.text.richText ?? '';
}

function exportedTable(editorId: string): HTMLTableElement | null {
	return new DOMParser().parseFromString(richTextOf(editorId), 'text/html').querySelector('table');
}

describe('TableCornerResizerPlugin', () => {
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

	async function setupEditorWithPastedTable(): Promise<{ editorId: string; cell: HTMLElement }> {
		const editor = generateNewMessageEditor();
		editor.text = { plainText: '', richText: '<p></p>' };
		setupEditorStore({ editors: [editor] });
		setupTest(<RichTextEditorContainer editorId={editor.id} onDragOver={vi.fn()} />);

		const editorElement = screen.getByTestId(EDITOR_TESTID);
		// eslint-disable-next-line testing-library/prefer-user-event -- userEvent cannot paste raw HTML clipboard data
		fireEvent.paste(editorElement, {
			clipboardData: {
				items: [],
				files: [],
				getData: (type: string): string => (type === 'text/html' ? PASTED_TABLE : ''),
				types: ['text/html']
			}
		});
		const table = await within(editorElement).findByRole('table');
		return { editorId: editor.id, cell: within(table).getAllByRole('cell')[0] };
	}

	it('shows the corner handle when a table is hovered', async () => {
		const { cell } = await setupEditorWithPastedTable();

		// eslint-disable-next-line testing-library/prefer-user-event -- the handle reacts to a raw mousemove over a specific cell
		fireEvent.mouseMove(cell);

		expect(await screen.findByRole('button', { name: CORNER_HANDLE_NAME })).toBeInTheDocument();
	});

	it('scales every column width and row height proportionally when dragging the corner', async () => {
		const { editorId, cell } = await setupEditorWithPastedTable();

		// eslint-disable-next-line testing-library/prefer-user-event -- the handle reacts to a raw mousemove over a specific cell
		fireEvent.mouseMove(cell);
		const handle = await screen.findByRole('button', { name: CORNER_HANDLE_NAME });

		/* eslint-disable testing-library/prefer-user-event -- simulating a pointer drag with explicit coordinates */
		fireEvent.mouseDown(handle, { clientX: 0, clientY: 0 });
		fireEvent.mouseMove(document, { clientX: 120, clientY: 48 });
		fireEvent.mouseUp(document, { clientX: 120, clientY: 48 });
		/* eslint-enable testing-library/prefer-user-event */

		// layout is not computed by jsdom, so the start size is the model's:
		// 240px wide (80 + 160) and one 24px row. +120px => x1.5, +48px => x3.
		await waitFor(() => {
			expect(exportedTable(editorId)?.getAttribute('style')).toContain('width: 360px');
		});
		const doc = new DOMParser().parseFromString(richTextOf(editorId), 'text/html');
		const cols = Array.from(doc.querySelectorAll('colgroup col'));
		expect(cols.map((col) => col.getAttribute('style'))).toEqual([
			expect.stringContaining('width: 120px'),
			expect.stringContaining('width: 240px')
		]);
		expect(doc.querySelector('tr')?.getAttribute('style')).toContain('height: 72px');
	});

	it('does not shrink columns below the minimum width', async () => {
		const { editorId, cell } = await setupEditorWithPastedTable();

		// eslint-disable-next-line testing-library/prefer-user-event -- the handle reacts to a raw mousemove over a specific cell
		fireEvent.mouseMove(cell);
		const handle = await screen.findByRole('button', { name: CORNER_HANDLE_NAME });

		/* eslint-disable testing-library/prefer-user-event -- simulating a pointer drag with explicit coordinates */
		fireEvent.mouseDown(handle, { clientX: 500, clientY: 0 });
		fireEvent.mouseMove(document, { clientX: 0, clientY: 0 });
		fireEvent.mouseUp(document, { clientX: 0, clientY: 0 });
		/* eslint-enable testing-library/prefer-user-event */

		// The 80px column would scale to ~27px: it is held at the 40px minimum.
		await waitFor(() => {
			expect(
				new DOMParser()
					.parseFromString(richTextOf(editorId), 'text/html')
					.querySelector('colgroup col')
					?.getAttribute('style')
			).toContain('width: 40px');
		});
	});
});
