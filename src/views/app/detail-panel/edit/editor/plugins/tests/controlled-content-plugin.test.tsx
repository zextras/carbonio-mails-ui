/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { act, waitFor } from '@testing-library/react';
import { $getRoot, $getSelection, $isRangeSelection, type LexicalEditor } from 'lexical';

import { setupTest, screen, within } from '@test-setup';
import { setupEditorStore } from '__test__/generators/editor-store';
import { generateNewMessageEditor } from 'store/editor/editor-generators';
import { useEditorsStore } from 'store/editor/store';
import { RichTextEditorContainer } from 'views/app/detail-panel/edit/editor/parts/rich-text-editor-container';

const EDITOR_TESTID = 'edit-view-editor';
const HELLO_WORLD = 'hello world';

/** Reads the Lexical editor instance Lexical attaches to its root DOM element. */
function getEditor(element: HTMLElement): LexicalEditor {
	return (element as unknown as { __lexicalEditor: LexicalEditor }).__lexicalEditor;
}

/** Absolute offset and text of the current caret anchor, or `null` if none. */
function readCaret(editor: LexicalEditor): { offset: number; text: string } | null {
	let caret: { offset: number; text: string } | null = null;
	editor.getEditorState().read(() => {
		const selection = $getSelection();
		if ($isRangeSelection(selection)) {
			caret = {
				offset: selection.anchor.offset,
				text: selection.anchor.getNode().getTextContent()
			};
		}
	});
	return caret;
}

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

	it('places the caret at the start after the initial content load', async () => {
		const firstParagraph = 'first';
		setupEditor(`<p>${firstParagraph}</p><p>second</p>`);
		const editorElement = screen.getByTestId(EDITOR_TESTID);
		await within(editorElement).findByText(firstParagraph);

		const caret = readCaret(getEditor(editorElement));
		expect(caret).toEqual({ offset: 0, text: firstParagraph });
	});

	it('preserves the caret position when content is replaced from an external source', async () => {
		const { editorId } = setupEditor(`<p>${HELLO_WORLD}</p>`);
		const editorElement = screen.getByTestId(EDITOR_TESTID);
		await within(editorElement).findByText(HELLO_WORLD);
		const editor = getEditor(editorElement);

		// Put the caret after "hello " (offset 6).
		act(() => {
			editor.update(() => {
				$getRoot().getAllTextNodes()[0].select(6, 6);
			});
		});

		// External replacement of the whole body (e.g. a signature change) that
		// keeps the text before the caret and appends after it.
		const replacement = 'hello world of mail';
		setText(editorId, replacement, `<p>${replacement}</p>`);
		await within(editorElement).findByText(replacement);

		expect(readCaret(editor)?.offset).toBe(6);
	});

	it('keeps the caret in an empty body when the signature below it is replaced', async () => {
		// New mail: empty compose area with the signature appended below it.
		const { editorId } = setupEditor('<p></p><div class="signature-div"><p>Sig</p></div>');
		const editorElement = screen.getByTestId(EDITOR_TESTID);
		await within(editorElement).findByText('Sig');
		const editor = getEditor(editorElement);

		// Swap the signature for a longer one, keeping the empty body.
		const newSignature = 'A brand new signature';
		setText(
			editorId,
			`\n${newSignature}`,
			`<p></p><div class="signature-div"><p>${newSignature}</p></div>`
		);
		await within(editorElement).findByText(newSignature);

		// The caret must stay in the empty body block, not jump into the signature.
		const caret = readCaret(editor);
		expect(caret?.offset).toBe(0);
		expect(caret?.text).toBe('');
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
