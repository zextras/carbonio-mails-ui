/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { waitFor, within } from '@testing-library/react';

import { setupTest, screen } from '@test-setup';
import { setupEditorStore } from '__test__/generators/editor-store';
import { generateNewMessageEditor } from 'store/editor/editor-generators';
import { useEditorsStore } from 'store/editor/store';
import { LexicalEditorContainer } from 'views/app/detail-panel/edit/editor/lexical-editor-container';

const CONTAINER_TESTID = 'LexicalEditorContainer';
const INITIAL_TEXT = 'initial content';
const INITIAL_HTML = `<p>${INITIAL_TEXT}</p>`;

function editorText(editorId: string): { richText: string; plainText: string } {
	const editor = useEditorsStore.getState().editors[editorId];
	return {
		richText: editor?.text.richText ?? '',
		plainText: editor?.text.plainText ?? ''
	};
}

function setupEditor(richText = INITIAL_HTML): {
	editorId: string;
	user: ReturnType<typeof setupTest>['user'];
	unmount: () => void;
} {
	const editor = generateNewMessageEditor();
	editor.text = { plainText: INITIAL_TEXT, richText };
	editor.isDirty = false;
	setupEditorStore({ editors: [editor] });
	const { user, unmount } = setupTest(<LexicalEditorContainer editorId={editor.id} />);
	return { editorId: editor.id, user, unmount };
}

describe('LexicalEditorContainer', () => {
	it('renders the toolbar and the content editable area', () => {
		setupEditor();

		expect(screen.getByTestId(CONTAINER_TESTID)).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'lexical-label.bold' })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'lexical-label.italic' })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'lexical-label.underline' })).toBeInTheDocument();
	});

	it('loads the initial draft HTML into the editor on mount', async () => {
		setupEditor();

		const container = screen.getByTestId(CONTAINER_TESTID);

		expect(await within(container).findByText(INITIAL_TEXT)).toBeInTheDocument();
	});

	it('shows the placeholder when there is no initial content', () => {
		setupEditor('');

		expect(screen.getByText('lexical-messages.write_your_message')).toBeInTheDocument();
	});

	it('marks the editor dirty and saves the text to the store after a user edit', async () => {
		const { editorId, user } = setupEditor();
		const container = screen.getByTestId(CONTAINER_TESTID);
		await within(container).findByText(INITIAL_TEXT);

		await user.click(within(container).getByText(INITIAL_TEXT));
		await user.keyboard(' edited');

		expect(useEditorsStore.getState().editors[editorId]?.isDirty).toBe(true);
		await waitFor(
			() => {
				expect(editorText(editorId).plainText).toContain('edited');
			},
			{ timeout: 5000 }
		);
		expect(editorText(editorId).richText).toContain('edited');
	});

	it('flushes the pending change to the store on unmount', async () => {
		const { editorId, user, unmount } = setupEditor();
		const container = screen.getByTestId(CONTAINER_TESTID);
		await within(container).findByText(INITIAL_TEXT);

		await user.click(within(container).getByText(INITIAL_TEXT));
		await user.keyboard(' flushed');

		unmount();

		expect(editorText(editorId).plainText).toContain('flushed');
	});

	it('applies bold formatting through the toolbar', async () => {
		const { editorId, user } = setupEditor();
		const container = screen.getByTestId(CONTAINER_TESTID);
		await within(container).findByText(INITIAL_TEXT);

		await user.click(within(container).getByText(INITIAL_TEXT));
		await user.keyboard('{Control>}a{/Control}');
		await user.click(screen.getByRole('button', { name: 'lexical-label.bold' }));

		await waitFor(
			() => {
				expect(editorText(editorId).richText).toContain('<strong');
			},
			{ timeout: 5000 }
		);
	});
});
