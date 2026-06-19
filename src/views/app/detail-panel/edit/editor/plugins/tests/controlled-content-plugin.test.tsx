/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { act, waitFor } from '@testing-library/react';

import { setupTest, screen, within } from '@test-setup';
import { setupEditorStore } from '__test__/generators/editor-store';
import { generateNewMessageEditor } from 'store/editor/editor-generators';
import { useEditorsStore } from 'store/editor/store';
import { RichTextEditorContainer } from 'views/app/detail-panel/edit/editor/parts/rich-text-editor-container';

const EDITOR_TESTID = 'edit-view-editor';
const HELLO_WORLD = 'hello world';

function editorState(editorId: string): {
	richText: string;
	plainText: string;
	isDirty: boolean;
} {
	const editor = useEditorsStore.getState().editors[editorId];
	return {
		richText: editor?.text.richText ?? '',
		plainText: editor?.text.plainText ?? '',
		isDirty: editor?.isDirty ?? false
	};
}

function setText(editorId: string, plainText: string, richText: string): void {
	act(() => {
		useEditorsStore.getState().setText(editorId, { plainText, richText });
	});
}

function setupEditor(richText: string): {
	editorId: string;
	user: ReturnType<typeof setupTest>['user'];
} {
	const editor = generateNewMessageEditor();
	editor.text = { plainText: 'initial', richText };
	editor.isDirty = false;
	setupEditorStore({ editors: [editor] });
	const { user } = setupTest(<RichTextEditorContainer editorId={editor.id} onDragOver={vi.fn()} />);
	return { editorId: editor.id, user };
}

describe('ControlledContentPlugin', () => {
	it('loads the initial draft HTML into the editor on mount', async () => {
		setupEditor('<p>initial content</p>');

		const editorElement = screen.getByTestId(EDITOR_TESTID);

		expect(await within(editorElement).findByText('initial content')).toBeInTheDocument();
	});

	it('syncs store -> editor when the rich text changes from an external source', async () => {
		const { editorId } = setupEditor('<p>original message</p>');
		const editorElement = screen.getByTestId(EDITOR_TESTID);
		await within(editorElement).findByText('original message');

		// e.g. a signature/identity switch updates the store text from the outside.
		setText(editorId, 'replaced message', '<p>replaced message</p>');

		expect(await within(editorElement).findByText('replaced message')).toBeInTheDocument();
		expect(within(editorElement).queryByText('original message')).not.toBeInTheDocument();
	});

	it('syncs editor -> store and marks the draft dirty on a user edit', async () => {
		const { editorId, user } = setupEditor('<p>hello world</p>');
		const editorElement = screen.getByTestId(EDITOR_TESTID);
		await within(editorElement).findByText(HELLO_WORLD);

		expect(editorState(editorId).isDirty).toBe(false);

		await user.click(editorElement);
		await user.keyboard('{Control>}a{/Control}');
		await user.click(screen.getByRole('button', { name: 'label.bold' }));

		await waitFor(() => {
			expect(editorState(editorId).isDirty).toBe(true);
		});
		const { richText, plainText } = editorState(editorId);
		expect(richText).toContain('font-weight: bold');
		expect(plainText).toBe(HELLO_WORLD);
	});

	it('ignores its own echo and does not duplicate the content', async () => {
		const { editorId, user } = setupEditor('<p>hello world</p>');
		const editorElement = screen.getByTestId(EDITOR_TESTID);
		await within(editorElement).findByText(HELLO_WORLD);

		// Produce an edit so the store holds the editor's own emitted HTML.
		await user.click(editorElement);
		await user.keyboard('{Control>}a{/Control}');
		await user.click(screen.getByRole('button', { name: 'label.bold' }));
		await waitFor(() => {
			expect(editorState(editorId).richText).toContain('font-weight: bold');
		});

		const emittedHtml = editorState(editorId).richText;
		// Feeding the same HTML back must be recognised as an echo (no re-parse).
		setText(editorId, HELLO_WORLD, emittedHtml);

		// The text still appears exactly once.
		expect(within(editorElement).getAllByText(HELLO_WORLD)).toHaveLength(1);
	});
});
