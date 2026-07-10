/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { $generateHtmlFromNodes } from '@lexical/html';
import { type LexicalEditor } from 'lexical';

import { setupTest, screen, within } from '@test-setup';
import { setupEditorStore } from '__test__/generators/editor-store';
import { generateNewMessageEditor } from 'store/editor/editor-generators';
import { RichTextEditorContainer } from 'views/app/detail-panel/edit/editor/parts/rich-text-editor-container';

const EDITOR_TESTID = 'edit-view-editor';

function getEditor(element: HTMLElement): LexicalEditor {
	return (element as unknown as { __lexicalEditor: LexicalEditor }).__lexicalEditor;
}

async function mountWith(richText: string): Promise<LexicalEditor> {
	const editor = generateNewMessageEditor();
	editor.text = { plainText: 'body', richText };
	editor.isDirty = false;
	setupEditorStore({ editors: [editor] });
	setupTest(<RichTextEditorContainer editorId={editor.id} onDragOver={vi.fn()} />);
	const editorElement = screen.getByTestId(EDITOR_TESTID);
	await within(editorElement).findByText('My Signature');
	return getEditor(editorElement);
}

function exportedHtml(editor: LexicalEditor): string {
	let html = '';
	editor.read(() => {
		html = $generateHtmlFromNodes(editor, null);
	});
	return html;
}

describe('SignatureNode', () => {
	it('keeps the <div class="signature-div"> wrapper through an editor round-trip', async () => {
		const editor = await mountWith(
			'<p>body text</p><div class="signature-div"><p>My Signature</p></div>'
		);

		const html = exportedHtml(editor);
		const doc = new DOMParser().parseFromString(html, 'text/html');
		const signatures = doc.getElementsByClassName('signature-div');

		// Without the node the wrapper is flattened into a plain <p> and the
		// signature-replacement logic can no longer find/remove the old signature.
		expect(signatures).toHaveLength(1);
		expect(signatures.item(0)?.textContent).toContain('My Signature');
		// The body text stays outside the signature wrapper.
		expect(signatures.item(0)?.textContent).not.toContain('body text');
	});

	it('preserves a single signature wrapper across repeated round-trips', async () => {
		const editor = await mountWith(
			'<p>body text</p><div class="signature-div"><p>My Signature</p></div>'
		);

		// Re-import the exported HTML and export again (as happens on every edit).
		const firstPass = exportedHtml(editor);
		const doc = new DOMParser().parseFromString(firstPass, 'text/html');

		expect(doc.getElementsByClassName('signature-div')).toHaveLength(1);
	});
});
