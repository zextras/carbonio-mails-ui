/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { waitFor } from '@testing-library/react';

import { setupTest, screen, within } from '@test-setup';
import { setupEditorStore } from '__test__/generators/editor-store';
import { generateNewMessageEditor } from 'store/editor/editor-generators';
import { useEditorsStore } from 'store/editor/store';
import { RichTextEditorContainer } from 'views/app/detail-panel/edit/editor/parts/rich-text-editor-container';

const LINK_URL = 'https://custom-link.com';
const LINK_TEXT = 'lexical';
const EDITOR_TESTID = 'edit-view-editor';
const EDIT_LINK_LABEL = 'lexical-label.edit_link';
const REMOVE_LINK_LABEL = 'lexical-label.remove_link';

type TestUser = ReturnType<typeof setupTest>['user'];

function richTextOf(editorId: string): string {
	return useEditorsStore.getState().editors[editorId]?.text.richText ?? '';
}

function setupEditor(richText: string): { editorId: string; user: TestUser } {
	const editor = generateNewMessageEditor();
	editor.text = { plainText: LINK_TEXT, richText };
	setupEditorStore({ editors: [editor] });
	const { user } = setupTest(<RichTextEditorContainer editorId={editor.id} onDragOver={vi.fn()} />);
	return { editorId: editor.id, user };
}

/** Renders the editor on a single-link paragraph and returns the rendered link element. */
async function setupWithLink(): Promise<{
	editorId: string;
	user: TestUser;
	link: HTMLElement;
}> {
	const { editorId, user } = setupEditor(`<p><a href="${LINK_URL}">${LINK_TEXT}</a></p>`);
	const editorElement = screen.getByTestId(EDITOR_TESTID);
	const link = await within(editorElement).findByText(LINK_TEXT);
	return { editorId, user, link };
}

describe('FloatingLinkEditorPlugin', () => {
	it('does not show the floating editor until the link is hovered or pressed', async () => {
		const { user } = await setupWithLink();
		const editorElement = screen.getByTestId(EDITOR_TESTID);

		// Selecting the content (without touching the link) must not reveal the card.
		await user.click(editorElement);
		await user.keyboard('{Control>}a{/Control}');

		expect(screen.queryByRole('button', { name: EDIT_LINK_LABEL })).not.toBeInTheDocument();
	});

	it('shows the floating editor with the URL when the link is hovered', async () => {
		const { user, link } = await setupWithLink();

		await user.hover(link);

		expect(await screen.findByRole('link', { name: LINK_URL })).toHaveAttribute('href', LINK_URL);
		expect(screen.getByRole('button', { name: EDIT_LINK_LABEL })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: REMOVE_LINK_LABEL })).toBeInTheDocument();
	});

	it('keeps the card visible for a grace period after the pointer leaves the link', async () => {
		const { user, link } = await setupWithLink();

		await user.hover(link);
		await screen.findByRole('button', { name: EDIT_LINK_LABEL });

		await user.unhover(link);

		// Right after leaving the link the card is still there: hiding is delayed
		// so the pointer can travel from the link to the card.
		expect(screen.getByRole('button', { name: EDIT_LINK_LABEL })).toBeInTheDocument();
		// Once the grace period expires without reaching the card, it hides.
		await waitFor(
			() => {
				expect(screen.queryByRole('button', { name: EDIT_LINK_LABEL })).not.toBeInTheDocument();
			},
			{ timeout: 2000 }
		);
	});

	it('does not hide the card while the pointer hovers the card itself', async () => {
		const { user, link } = await setupWithLink();

		await user.hover(link);
		const editButton = await screen.findByRole('button', { name: EDIT_LINK_LABEL });

		await user.unhover(link);
		await user.hover(editButton);

		// Wait well past the grace period: hovering the card cancels the hide.
		await new Promise((resolve) => {
			setTimeout(resolve, 800);
		});
		expect(screen.getByRole('button', { name: EDIT_LINK_LABEL })).toBeInTheDocument();
	});

	it('removes the link when the remove action is clicked', async () => {
		const { editorId, user, link } = await setupWithLink();

		await user.click(link);
		await user.click(await screen.findByRole('button', { name: REMOVE_LINK_LABEL }));

		await waitFor(() => {
			expect(richTextOf(editorId)).not.toContain('<a');
		});
		// The text content is preserved after the link is removed.
		expect(richTextOf(editorId)).toContain(LINK_TEXT);
	});

	it('opens the edit modal pre-filled when the edit action is clicked', async () => {
		const { user, link } = await setupWithLink();

		await user.click(link);
		await user.click(await screen.findByRole('button', { name: EDIT_LINK_LABEL }));

		expect(await screen.findByText('lexical-label.insert_edit_link')).toBeInTheDocument();
		expect(screen.getByRole('textbox', { name: 'lexical-label.url' })).toHaveValue(LINK_URL);
		expect(screen.getByRole('textbox', { name: 'lexical-label.text_to_display' })).toHaveValue(LINK_TEXT);
	});
});
