/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { act, waitFor } from '@testing-library/react';
import { $getRoot, $getSelection, $isRangeSelection, type LexicalEditor } from 'lexical';

import { setupTest, screen } from '@test-setup';
import { setupEditorStore } from '__test__/generators/editor-store';
import { generateNewMessageEditor } from 'store/editor/editor-generators';
import { useEditorsStore } from 'store/editor/store';
import { RichTextEditorContainer } from 'views/app/detail-panel/edit/editor/parts/rich-text-editor-container';

const EDITOR_TESTID = 'edit-view-editor';

function richTextOf(editorId: string): string {
	return useEditorsStore.getState().editors[editorId]?.text.richText ?? '';
}

function setupEditor(): { editorId: string; lexicalEditor: LexicalEditor } {
	const editor = generateNewMessageEditor();
	editor.text = { plainText: '', richText: '<p><br></p>' };
	setupEditorStore({ editors: [editor] });
	setupTest(<RichTextEditorContainer editorId={editor.id} onDragOver={vi.fn()} />);
	const editorElement = screen.getByTestId(EDITOR_TESTID) as HTMLElement & {
		__lexicalEditor: LexicalEditor;
	};
	return { editorId: editor.id, lexicalEditor: editorElement.__lexicalEditor };
}

/**
 * Lexical's markdown-shortcut heuristic only fires a transform when it sees
 * the anchor offset advance by exactly one character since the previous
 * update, so each character must land in its own flushed update — matching
 * how a real keystroke is committed one at a time.
 */
async function typeChars(editor: LexicalEditor, text: string): Promise<void> {
	await text.split('').reduce(
		(previous, char) =>
			previous.then(() =>
				act(async () => {
					editor.update(() => {
						const selection = $getSelection();
						if ($isRangeSelection(selection)) {
							selection.insertText(char);
						}
					});
					await Promise.resolve();
				})
			),
		Promise.resolve()
	);
}

async function selectStartOfEditor(editor: LexicalEditor): Promise<void> {
	await act(async () => {
		editor.update(() => {
			$getRoot().getFirstChild()?.selectStart();
		});
		await Promise.resolve();
	});
}

describe('ListMarkdownShortcutPlugin', () => {
	it.each([
		['-', '<ul'],
		['*', '<ul'],
		['1.', '<ol']
	])('turns "%s" followed by a space into a list', async (marker, expectedTag) => {
		const { editorId, lexicalEditor } = setupEditor();

		await selectStartOfEditor(lexicalEditor);
		await typeChars(lexicalEditor, `${marker} item`);

		await waitFor(() => {
			expect(richTextOf(editorId)).toContain(expectedTag);
		});
	});

	it('does not treat a hyphen typed mid-sentence as a list shortcut', async () => {
		const { editorId, lexicalEditor } = setupEditor();

		await selectStartOfEditor(lexicalEditor);
		await typeChars(lexicalEditor, 'foo - bar');

		await waitFor(() => {
			expect(richTextOf(editorId)).not.toContain('<ul');
		});
	});
});
