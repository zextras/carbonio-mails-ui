/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
/* eslint-disable max-classes-per-file -- two minimal Event stubs cover a jsdom gap (see below) */
/* eslint-disable jest-dom/prefer-to-have-style, jest-dom/prefer-to-have-attribute -- the size assertions are on the exported HTML, a detached document parsed from a string that toHaveStyle/toHaveAttribute cannot check */
import React from 'react';

import { act, cleanup, fireEvent, waitFor } from '@testing-library/react';
import { $createParagraphNode, $getRoot, type LexicalEditor } from 'lexical';

import { setupTest, screen, within } from '@test-setup';
import { setupEditorStore } from '__test__/generators/editor-store';
import { generateNewMessageEditor } from 'store/editor/editor-generators';
import { useEditorsStore } from 'store/editor/store';
import { RichTextEditorContainer } from 'views/app/detail-panel/edit/editor/parts/rich-text-editor-container';
import { SignatureRichTextEditor } from 'views/settings/components/signature-rich-text-editor';

type TestUser = ReturnType<typeof setupTest>['user'];

type Point = { clientX: number; clientY: number };

const CORNER_HANDLE_NAME = 'lexical-label.table_resize';
const ADD_COLUMN_LABEL = 'lexical-label.table_add_column';
const EDITOR_TESTID = 'edit-view-editor';
const SIGNATURE_TESTID = 'signature-editor-content-editable';
const OUTLINE_TESTID = 'table-corner-resizer-outline';
const ORIGIN: Point = { clientX: 0, clientY: 0 };

// Two columns of 80px and 160px (240px), one row: jsdom lays nothing out, so
// these model sizes are the start size of a drag.
const TWO_COLUMNS_TABLE =
	'<table><colgroup><col style="width:80px"><col style="width:160px"></colgroup>' +
	'<tbody><tr><td style="width:80px">A</td><td>B</td></tr></tbody></table>';

// jsdom (20) implements neither DragEvent nor ClipboardEvent, yet Lexical's
// default paste handler does `instanceof` checks against both. Two distinct
// no-op Event subclasses stand in so the checks resolve (rather than throwing a
// ReferenceError) and the synthetic paste event is classified as a clipboard
// paste, not a drag.
class StubDragEvent extends Event {}
class StubClipboardEvent extends Event {}

function richTextOf(editorId: string): string {
	return useEditorsStore.getState().editors[editorId]?.text.richText ?? '';
}

const parse = (html: string): Document => new DOMParser().parseFromString(html, 'text/html');

/* eslint-disable testing-library/no-node-access -- parsing the exported HTML string, not the rendered DOM */
function exportedTableOf(html: string): HTMLTableElement {
	return parse(html).querySelector('table') as HTMLTableElement;
}

function exportedColWidths(html: string): Array<string> {
	return Array.from(
		parse(html).querySelectorAll<HTMLElement>('colgroup col'),
		(col) => col.style.width
	);
}

function exportedRowHeights(html: string): Array<string> {
	return Array.from(parse(html).querySelectorAll('tr'), (row) => row.style.height);
}

function exportedCellWidth(html: string, text: string): string | undefined {
	return Array.from(parse(html).querySelectorAll('td')).find((cell) => cell.textContent === text)
		?.style.width;
}
/* eslint-enable testing-library/no-node-access */

/** Renders the composer with `richText` as body. */
function setupEditorWith(richText: string): { editorId: string; user: TestUser } {
	const editor = generateNewMessageEditor();
	editor.text = { plainText: '', richText };
	setupEditorStore({ editors: [editor] });
	const { user } = setupTest(<RichTextEditorContainer editorId={editor.id} onDragOver={vi.fn()} />);
	return { editorId: editor.id, user };
}

/** Pastes `html` in the composer, as from Excel or a web page, and returns the rendered table. */
async function pasteTable(html: string): Promise<HTMLElement> {
	const editorElement = screen.getByTestId(EDITOR_TESTID);
	// eslint-disable-next-line testing-library/prefer-user-event -- userEvent cannot paste raw HTML clipboard data
	fireEvent.paste(editorElement, {
		clipboardData: {
			items: [],
			files: [],
			getData: (type: string): string => (type === 'text/html' ? html : ''),
			types: ['text/html']
		}
	});
	return within(editorElement).findByRole('table');
}

/** The Lexical editor of the composer, to change it the way other code would. */
function composerEditor(): LexicalEditor {
	return (screen.getByTestId(EDITOR_TESTID) as unknown as { __lexicalEditor: LexicalEditor })
		.__lexicalEditor;
}

/**
 * Renders an empty composer, pastes `html` and returns the editor id and the
 * table, once the body holding it is in the store: the tests compare the body
 * before and after a drag. The paste waits for the body to be loaded, as a user
 * would: a change of a still empty editor is not reported to the store.
 */
async function setupWithPastedTable(
	html = TWO_COLUMNS_TABLE
): Promise<{ editorId: string; user: TestUser; table: HTMLElement }> {
	const { editorId, user } = setupEditorWith('<p></p>');
	await waitFor(() => {
		expect(composerEditor().getEditorState().isEmpty()).toBe(false);
	});
	const table = await pasteTable(html);
	await waitFor(() => {
		expect(richTextOf(editorId)).toContain('<table');
	});
	return { editorId, user, table };
}

/** Renders the composer and inserts a 2x2 table with the toolbar. */
async function setupWithInsertedTable(): Promise<{ editorId: string; table: HTMLElement }> {
	const { editorId, user } = setupEditorWith('<p></p>');
	await user.click(screen.getByTestId(EDITOR_TESTID));
	await user.click(screen.getByRole('button', { name: 'lexical-label.table' }));
	await user.click(await screen.findByTestId('table-grid-cell-2-2'));
	const table = await within(screen.getByTestId(EDITOR_TESTID)).findByRole('table');
	return { editorId, table };
}

/**
 * Gives tables, rows and cells the on-screen size jsdom does not compute: a
 * table of two 150px columns and two 30px rows, at the top-left corner of the
 * editor. `spacing` is what borders and spacing around the cells add to the
 * width of the table.
 */
function mockTableLayout(spacing = 0): void {
	const sizes: Record<string, { width: number; height: number }> = {
		TABLE: { width: 300 + spacing, height: 60 },
		TR: { width: 300, height: 30 },
		TD: { width: 150, height: 30 },
		TH: { width: 150, height: 30 }
	};
	vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(
		function boundingClientRect(this: Element): DOMRect {
			const { width, height } = sizes[this.tagName] ?? { width: 0, height: 0 };
			return {
				x: 0,
				y: 0,
				top: 0,
				left: 0,
				right: width,
				bottom: height,
				width,
				height,
				toJSON: () => ({})
			};
		}
	);
}

/**
 * Moves the pointer over `element`: the handle reacts to a raw `mousemove`
 * over a specific cell, which `userEvent` cannot target precisely.
 */
function hover(element: HTMLElement): void {
	// eslint-disable-next-line testing-library/prefer-user-event
	fireEvent.mouseMove(element);
}

/** Hovers `cell` and returns the corner handle of its table. */
async function cornerHandleOf(cell: HTMLElement): Promise<HTMLElement> {
	hover(cell);
	return screen.findByRole('button', { name: CORNER_HANDLE_NAME });
}

/* eslint-disable testing-library/prefer-user-event -- simulating a pointer drag with explicit coordinates */
function pressHandle(handle: HTMLElement, at: Point = ORIGIN): void {
	fireEvent.mouseDown(handle, at);
}

function movePointer(to: Point): void {
	fireEvent.mouseMove(document, to);
}

function releasePointer(at: Point): void {
	fireEvent.mouseUp(document, at);
}
/* eslint-enable testing-library/prefer-user-event */

/** Drags the corner handle of the table of `cell` by (`clientX`, `clientY`). */
async function dragCorner(cell: HTMLElement, by: Point): Promise<void> {
	pressHandle(await cornerHandleOf(cell));
	movePointer(by);
	releasePointer(by);
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
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('shows the handle on the bottom-right corner of the table under the pointer', async () => {
		const { table } = await setupWithInsertedTable();
		mockTableLayout();
		expect(screen.queryByRole('button', { name: CORNER_HANDLE_NAME })).not.toBeInTheDocument();

		const handle = await cornerHandleOf(within(table).getAllByRole('cell')[0]);

		expect(handle).toHaveStyle({ top: '60px', left: '300px' });
	});

	it('hides the handle when the pointer leaves the table', async () => {
		setupEditorWith(`<p>before the table</p>${TWO_COLUMNS_TABLE}`);
		const editorElement = screen.getByTestId(EDITOR_TESTID);
		const table = await within(editorElement).findByRole('table');
		await cornerHandleOf(within(table).getByRole('cell', { name: 'A' }));

		hover(within(editorElement).getByText('before the table'));

		await waitFor(() => {
			expect(screen.queryByRole('button', { name: CORNER_HANDLE_NAME })).not.toBeInTheDocument();
		});
	});

	it('scales every column and row by the same ratio, so the table gets the dragged size', async () => {
		const { editorId, table } = await setupWithPastedTable();

		// 240px wide and one 24px (minimum) row: +120px is x1.5, +48px is x3
		await dragCorner(within(table).getByRole('cell', { name: 'A' }), {
			clientX: 120,
			clientY: 48
		});

		await waitFor(() => {
			expect(exportedTableOf(richTextOf(editorId)).style.width).toBe('360px');
		});
		const html = richTextOf(editorId);
		expect(exportedTableOf(html).style.tableLayout).toBe('fixed');
		expect(exportedColWidths(html)).toEqual(['120px', '240px']);
		expect(exportedCellWidth(html, 'A')).toBe('120px');
		expect(exportedCellWidth(html, 'B')).toBe('240px');
		expect(exportedRowHeights(html)).toEqual(['72px']);
	});

	it('scales a table inserted from the toolbar from the size it has on screen', async () => {
		const { editorId, table } = await setupWithInsertedTable();
		mockTableLayout();

		await dragCorner(within(table).getAllByRole('cell')[0], { clientX: 150, clientY: 30 });

		await waitFor(() => {
			expect(exportedTableOf(richTextOf(editorId)).style.width).toBe('450px');
		});
		const html = richTextOf(editorId);
		expect(exportedColWidths(html)).toEqual(['225px', '225px']);
		expect(exportedRowHeights(html)).toEqual(['45px', '45px']);
	});

	it('shows an outline of the new size that follows the pointer and stops at the minimum size', async () => {
		const { editorId, table } = await setupWithInsertedTable();
		mockTableLayout();
		const handle = await cornerHandleOf(within(table).getAllByRole('cell')[0]);
		const corner = { clientX: 300, clientY: 60 };

		pressHandle(handle, corner);
		expect(screen.getByTestId(OUTLINE_TESTID)).toHaveStyle({ width: '300px', height: '60px' });
		movePointer({ clientX: 400, clientY: 100 });
		expect(screen.getByTestId(OUTLINE_TESTID)).toHaveStyle({ width: '400px', height: '100px' });
		// Towards the top-left, past the table: two 40px columns and two 24px rows.
		const farTopLeft = { clientX: -500, clientY: -500 };
		movePointer(farTopLeft);
		expect(screen.getByTestId(OUTLINE_TESTID)).toHaveStyle({ width: '80px', height: '48px' });
		releasePointer(farTopLeft);

		expect(screen.queryByTestId(OUTLINE_TESTID)).not.toBeInTheDocument();
		await waitFor(() => {
			expect(exportedColWidths(richTextOf(editorId))).toEqual(['40px', '40px']);
		});
		expect(exportedRowHeights(richTextOf(editorId))).toEqual(['24px', '24px']);
		expect(exportedTableOf(richTextOf(editorId)).style.width).toBe('80px');
	});

	it('holds a column at the minimum width when the scaling would make it narrower', async () => {
		const { editorId, table } = await setupWithPastedTable();

		// 240px to 90px is x0.375: the 160px column becomes 60px, the 80px one would
		// be 30px and is held at 40px, so the table ends 10px wider than dragged.
		await dragCorner(within(table).getByRole('cell', { name: 'A' }), {
			clientX: -150,
			clientY: 0
		});

		await waitFor(() => {
			expect(exportedColWidths(richTextOf(editorId))).toEqual(['40px', '60px']);
		});
		expect(exportedTableOf(richTextOf(editorId)).style.width).toBe('100px');
	});

	it.each([
		['horizontally', { clientX: 120, clientY: 3 }, '360px', ['']],
		['vertically', { clientX: -3, clientY: 48 }, '', ['72px']]
	])(
		'changes only the dragged dimension when the corner is dragged %s, ignoring a slight movement on the other axis',
		async (_case, by, tableWidth, rowHeights) => {
			const { editorId, table } = await setupWithPastedTable();
			const before = richTextOf(editorId);

			await dragCorner(within(table).getByRole('cell', { name: 'A' }), by);

			await waitFor(() => {
				expect(richTextOf(editorId)).not.toBe(before);
			});
			const html = richTextOf(editorId);
			expect(exportedTableOf(html).style.width).toBe(tableWidth);
			expect(exportedRowHeights(html)).toEqual(rowHeights);
		}
	);

	it('does not change the table when the handle is pressed and released without moving', async () => {
		const { editorId, table } = await setupWithPastedTable();
		const before = richTextOf(editorId);
		const handle = await cornerHandleOf(within(table).getByRole('cell', { name: 'A' }));

		pressHandle(handle, { clientX: 10, clientY: 10 });
		releasePointer({ clientX: 10, clientY: 10 });

		expect(await screen.findByRole('button', { name: CORNER_HANDLE_NAME })).toBeVisible();
		expect(richTextOf(editorId)).toBe(before);
	});

	it('does not start a drag from a button other than the main one', async () => {
		const { table } = await setupWithPastedTable();
		const handle = await cornerHandleOf(within(table).getByRole('cell', { name: 'A' }));

		// eslint-disable-next-line testing-library/prefer-user-event -- a press of a specific mouse button
		fireEvent.mouseDown(handle, { button: 2 });

		expect(screen.queryByTestId(OUTLINE_TESTID)).not.toBeInTheDocument();
	});

	it('keeps a cell spanning more columns as wide as the columns it spans', async () => {
		const { editorId, table } = await setupWithPastedTable(
			'<table><tbody><tr><td colspan="2" style="width:300px">H</td></tr>' +
				'<tr><td style="width:100px">A</td><td style="width:200px">B</td></tr></tbody></table>'
		);

		await dragCorner(within(table).getByRole('cell', { name: 'A' }), { clientX: 150, clientY: 0 });

		await waitFor(() => {
			expect(exportedTableOf(richTextOf(editorId)).style.width).toBe('450px');
		});
		const html = richTextOf(editorId);
		expect(exportedColWidths(html)).toEqual(['150px', '300px']);
		expect(exportedCellWidth(html, 'H')).toBe('450px');
	});

	it('keeps the other declarations of a table from a received message and drops its old width', async () => {
		const { editorId } = setupEditorWith(
			'<table width="480" style="border: 1px solid red"><colgroup><col style="width:80px"><col style="width:160px"></colgroup>' +
				'<tbody><tr><td>A</td><td>B</td></tr></tbody></table>'
		);
		const table = await within(screen.getByTestId(EDITOR_TESTID)).findByRole('table');

		await dragCorner(within(table).getByRole('cell', { name: 'A' }), { clientX: 120, clientY: 0 });

		await waitFor(() => {
			expect(exportedTableOf(richTextOf(editorId)).style.width).toBe('360px');
		});
		const exported = exportedTableOf(richTextOf(editorId));
		expect(exported.style.border).toBe('1px solid red');
		// juice mirrors the new width in the attribute, for mail clients ignoring CSS widths
		expect(exported.getAttribute('width')).toBe('360');
	});

	it.each([
		['inserted from the toolbar', true],
		['pasted', false]
	])(
		'keeps the new size of a table %s when the saved draft is opened again',
		async (_case, inserted) => {
			const { editorId, table } = inserted
				? await setupWithInsertedTable()
				: await setupWithPastedTable();
			if (inserted) {
				mockTableLayout();
			}
			await dragCorner(within(table).getAllByRole('cell')[0], { clientX: 150, clientY: 30 });
			await waitFor(() => {
				expect(exportedTableOf(richTextOf(editorId)).style.width).not.toBe('');
			});
			const savedHtml = richTextOf(editorId);
			const savedTable = exportedTableOf(savedHtml);
			vi.restoreAllMocks();
			cleanup();

			setupEditorWith(savedHtml);
			const reloaded = await within(screen.getByTestId(EDITOR_TESTID)).findByRole('table');

			expect(reloaded).toHaveStyle({
				width: savedTable.style.width,
				tableLayout: 'fixed'
			});
			const rows = within(reloaded).getAllByRole('row');
			expect(rows.map((row) => row.style.height)).toEqual(exportedRowHeights(savedHtml));
			// eslint-disable-next-line testing-library/no-node-access -- the <col> elements have no role
			const cols = Array.from(reloaded.querySelectorAll<HTMLElement>('col'));
			expect(cols.map((col) => col.style.width)).toEqual(exportedColWidths(savedHtml));
		}
	);

	it('keeps the table as wide as its columns when a column is added after a resize', async () => {
		// Two rows: on the last row the "+" adds a row instead of a column.
		const { editorId, user, table } = await setupWithPastedTable(
			'<table><colgroup><col style="width:80px"><col style="width:160px"></colgroup>' +
				'<tbody><tr><td>A</td><td>B</td></tr><tr><td>C</td><td>D</td></tr></tbody></table>'
		);
		await dragCorner(within(table).getByRole('cell', { name: 'A' }), { clientX: 120, clientY: 0 });
		await waitFor(() => {
			expect(exportedTableOf(richTextOf(editorId)).style.width).toBe('360px');
		});

		hover(within(table).getByRole('cell', { name: 'B' }));
		await user.click(await screen.findByRole('button', { name: ADD_COLUMN_LABEL }));

		await waitFor(() => {
			// the new column copies the 240px of the one it is added after
			expect(exportedTableOf(richTextOf(editorId)).style.width).toBe('600px');
		});
		expect(exportedColWidths(richTextOf(editorId))).toEqual(['120px', '240px', '240px']);
	});

	it('measures on screen a column whose stored width is not a finite number', async () => {
		// A width attribute of 400 digits is read as an infinite width.
		const { editorId, table } = await setupWithPastedTable(
			`<table><colgroup><col width="${'9'.repeat(400)}"><col width="160"></colgroup>` +
				'<tbody><tr><td>A</td><td>B</td></tr></tbody></table>'
		);
		mockTableLayout();

		await dragCorner(within(table).getByRole('cell', { name: 'A' }), { clientX: 120, clientY: 0 });

		// the two 150px columns on screen, scaled to the 300px of the table + 120px
		await waitFor(() => {
			expect(exportedTableOf(richTextOf(editorId)).style.width).toBe('420px');
		});
		expect(exportedColWidths(richTextOf(editorId))).toEqual(['210px', '210px']);
		expect(richTextOf(editorId)).not.toContain('Infinity');
	});

	it('scales the columns from the widths they have on screen rather than the stored ones', async () => {
		// Stored as 80px + 160px, shown as two 150px columns (e.g. by their content).
		const { editorId, table } = await setupWithPastedTable();
		mockTableLayout();

		await dragCorner(within(table).getByRole('cell', { name: 'A' }), { clientX: 120, clientY: 0 });

		await waitFor(() => {
			expect(exportedTableOf(richTextOf(editorId)).style.width).toBe('420px');
		});
		expect(exportedColWidths(richTextOf(editorId))).toEqual(['210px', '210px']);
	});

	it('leaves out of the columns the spacing around the cells, which the table keeps', async () => {
		// e.g. cellspacing="4" border="1": the table is 18px wider than its columns
		const { editorId, table } = await setupWithPastedTable();
		mockTableLayout(18);

		await dragCorner(within(table).getByRole('cell', { name: 'A' }), { clientX: 120, clientY: 0 });

		// the columns get the 120px, the browser adds the 18px back to the table
		await waitFor(() => {
			expect(exportedColWidths(richTextOf(editorId))).toEqual(['210px', '210px']);
		});
		expect(exportedTableOf(richTextOf(editorId)).style.width).toBe('420px');
	});

	it('ends the drag only when the main button is released', async () => {
		const { editorId, table } = await setupWithPastedTable();
		const handle = await cornerHandleOf(within(table).getByRole('cell', { name: 'A' }));
		const moved = { clientX: 120, clientY: 0 };

		pressHandle(handle);
		movePointer(moved);
		// eslint-disable-next-line testing-library/prefer-user-event -- a release of a specific mouse button
		fireEvent.mouseUp(document, { ...moved, button: 2 });

		expect(screen.getByTestId(OUTLINE_TESTID)).toBeVisible();
		releasePointer(moved);
		await waitFor(() => {
			expect(exportedTableOf(richTextOf(editorId)).style.width).toBe('360px');
		});
	});

	it('drops the handle when the table is removed during a drag', async () => {
		const { table } = await setupWithPastedTable();
		const handle = await cornerHandleOf(within(table).getByRole('cell', { name: 'A' }));
		const moved = { clientX: 120, clientY: 0 };

		pressHandle(handle);
		movePointer(moved);
		act(() => {
			composerEditor().update(() => $getRoot().clear().append($createParagraphNode()), {
				discrete: true
			});
		});
		releasePointer(moved);

		expect(screen.queryByTestId(OUTLINE_TESTID)).not.toBeInTheDocument();
		await waitFor(() => {
			expect(screen.queryByRole('button', { name: CORNER_HANDLE_NAME })).not.toBeInTheDocument();
		});
	});

	it('offers no resize while the editor is read-only', async () => {
		const { table } = await setupWithPastedTable();
		const cell = within(table).getByRole('cell', { name: 'A' });
		await cornerHandleOf(cell);

		act(() => composerEditor().setEditable(false));

		await waitFor(() => {
			expect(screen.queryByRole('button', { name: CORNER_HANDLE_NAME })).not.toBeInTheDocument();
		});
		hover(cell);
		expect(screen.queryByRole('button', { name: CORNER_HANDLE_NAME })).not.toBeInTheDocument();
	});

	it.each([
		// eslint-disable-next-line testing-library/prefer-user-event -- a key press outside any element
		['Escape is pressed', (): boolean => fireEvent.keyDown(document, { key: 'Escape' })],
		['the window loses the focus', (): boolean => fireEvent.blur(window)]
	])('cancels the drag, leaving the table as it was, when %s', async (_case, cancel) => {
		const { editorId, table } = await setupWithPastedTable();
		const before = richTextOf(editorId);
		const handle = await cornerHandleOf(within(table).getByRole('cell', { name: 'A' }));
		const moved = { clientX: 120, clientY: 48 };

		pressHandle(handle);
		movePointer(moved);
		cancel();

		expect(screen.queryByTestId(OUTLINE_TESTID)).not.toBeInTheDocument();
		// a later release does not resize the table either
		releasePointer(moved);
		expect(await screen.findByRole('button', { name: CORNER_HANDLE_NAME })).toBeVisible();
		expect(richTextOf(editorId)).toBe(before);
	});

	it('stops following the pointer when the editor is closed during a drag', async () => {
		const { table } = await setupWithPastedTable();
		const handle = await cornerHandleOf(within(table).getByRole('cell', { name: 'A' }));
		const added = [vi.spyOn(document, 'addEventListener'), vi.spyOn(window, 'addEventListener')];
		const removed = [
			vi.spyOn(document, 'removeEventListener'),
			vi.spyOn(window, 'removeEventListener')
		];
		const listenersOf = (spies: typeof added | typeof removed): Array<[string, unknown]> =>
			spies.flatMap((spy) =>
				spy.mock.calls.map(([type, listener]): [string, unknown] => [type, listener])
			);

		pressHandle(handle);
		const dragListeners = listenersOf(added).filter(([type]) =>
			['mousemove', 'mouseup', 'keydown', 'blur'].includes(type)
		);
		cleanup();

		expect(dragListeners).toHaveLength(4);
		expect(listenersOf(removed)).toEqual(expect.arrayContaining(dragListeners));
	});

	it('resizes a table of the signature editor from its corner', async () => {
		const onChange = vi.fn();
		setupTest(<SignatureRichTextEditor value={TWO_COLUMNS_TABLE} onChange={onChange} />);
		const table = await within(screen.getByTestId(SIGNATURE_TESTID)).findByRole('table');

		await dragCorner(within(table).getByRole('cell', { name: 'A' }), { clientX: 120, clientY: 0 });

		await waitFor(() => {
			expect(onChange).toHaveBeenLastCalledWith(expect.stringContaining('width: 360px'));
		});
		expect(exportedColWidths(onChange.mock.lastCall?.[0])).toEqual(['120px', '240px']);
	});
});
