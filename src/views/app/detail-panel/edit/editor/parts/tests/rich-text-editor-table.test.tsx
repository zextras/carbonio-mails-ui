/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { setupTest, screen, within } from '@test-setup';

import { RichTextEditorContainer } from '../rich-text-editor-container';
import { setupEditorStore } from '__test__/generators/editor-store';
import { generateNewMessageEditor } from 'store/editor/editor-generators';

describe('RichTextEditorContainer table insertion', () => {
	it('inserts a table with the dimensions picked from the toolbar grid', async () => {
		const editor = generateNewMessageEditor();
		setupEditorStore({ editors: [editor] });

		const { user } = setupTest(
			<RichTextEditorContainer editorId={editor.id} onDragOver={vi.fn()} />
		);

		// Place the selection inside the editor before inserting.
		await user.click(screen.getByTestId('edit-view-editor'));

		// Open the toolbar Table dropdown and pick a 2x2 size from the grid.
		await user.click(screen.getByRole('button', { name: 'label.table' }));
		await user.click(await screen.findByTestId('table-grid-cell-2-2'));

		const editorElement = screen.getByTestId('edit-view-editor');
		const table = await within(editorElement).findByRole('table');

		expect(table).toBeInTheDocument();
		// A 2x2 table has 2 rows...
		expect(within(table).getAllByRole('row')).toHaveLength(2);
		// ...and 4 cells in total.
		expect(within(table).getAllByRole('cell')).toHaveLength(4);
	});

	it('renders a table from existing draft HTML, preserving header and cell background', async () => {
		const editor = generateNewMessageEditor();
		editor.text = {
			plainText: 'Head Body',
			richText:
				'<table><tbody>' +
				'<tr><th>Head</th></tr>' +
				'<tr><td style="background-color: rgb(255, 0, 0);">Body</td></tr>' +
				'</tbody></table>'
		};
		setupEditorStore({ editors: [editor] });

		setupTest(<RichTextEditorContainer editorId={editor.id} onDragOver={vi.fn()} />);

		const editorElement = screen.getByTestId('edit-view-editor');
		const table = await within(editorElement).findByRole('table');

		const headerCell = table.querySelector('th');
		expect(headerCell).toHaveTextContent('Head');

		const bodyCell = table.querySelector('td');
		expect(bodyCell).toHaveTextContent('Body');
		expect(bodyCell).toHaveStyle({ backgroundColor: 'rgb(255, 0, 0)' });
	});

	it('inserts a row through the cell action menu', async () => {
		const editor = generateNewMessageEditor();
		setupEditorStore({ editors: [editor] });

		const { user } = setupTest(
			<RichTextEditorContainer editorId={editor.id} onDragOver={vi.fn()} />
		);

		await user.click(screen.getByTestId('edit-view-editor'));
		await user.click(screen.getByRole('button', { name: 'label.table' }));
		await user.click(await screen.findByTestId('table-grid-cell-2-2'));

		const table = await within(screen.getByTestId('edit-view-editor')).findByRole('table');
		expect(within(table).getAllByRole('row')).toHaveLength(2);

		// Open the floating cell action menu and insert a row below.
		await user.click(await screen.findByRoleWithIcon('button', { icon: 'icon: ChevronDown' }));
		await user.click(await screen.findByText('label.table_insert_row_below'));

		expect(within(table).getAllByRole('row')).toHaveLength(3);
	});
});
