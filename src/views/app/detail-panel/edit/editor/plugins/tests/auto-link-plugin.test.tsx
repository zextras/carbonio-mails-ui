/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { waitFor } from '@testing-library/react';

import { setupTest, screen } from '@test-setup';
import { setupEditorStore } from '__test__/generators/editor-store';
import { generateNewMessageEditor } from 'store/editor/editor-generators';
import { useEditorsStore } from 'store/editor/store';
import { RichTextEditorContainer } from 'views/app/detail-panel/edit/editor/parts/rich-text-editor-container';

// jsdom's `Range` doesn't implement `getBoundingClientRect`, which Lexical's
// reconciler calls (to scroll the caret into view) whenever a collapsed
// selection commits while the editor root has focus — a path only exercised
// by tests that actually type into the editor while it's focused.
beforeAll(() => {
	if (typeof Range.prototype.getBoundingClientRect !== 'function') {
		Range.prototype.getBoundingClientRect = (): DOMRect =>
			({
				bottom: 0,
				height: 0,
				left: 0,
				right: 0,
				top: 0,
				width: 0,
				x: 0,
				y: 0,
				toJSON: () => ({})
			}) as DOMRect;
	}
});

const EDITOR_TESTID = 'edit-view-editor';
const ZEXTRAS_URL = 'https://www.zextras.com';

function richTextOf(editorId: string): string {
	return useEditorsStore.getState().editors[editorId]?.text.richText ?? '';
}

function setupEditor(): { editorId: string; user: ReturnType<typeof setupTest>['user'] } {
	const editor = generateNewMessageEditor();
	setupEditorStore({ editors: [editor] });
	const { user } = setupTest(<RichTextEditorContainer editorId={editor.id} onDragOver={vi.fn()} />);
	return { editorId: editor.id, user };
}

describe('AutoLinkPlugin', () => {
	it.each([
		['a typed URL, once a space is typed after it', `${ZEXTRAS_URL} `, ZEXTRAS_URL],
		['a typed URL, once a new line is created after it', `${ZEXTRAS_URL}{Enter}`, ZEXTRAS_URL],
		['a scheme-less www. URL, prefixing it with https://', 'www.zextras.com ', ZEXTRAS_URL]
	])('turns %s into a link with href %s', async (_case, typed, expectedHref) => {
		const { editorId, user } = setupEditor();
		const editorElement = screen.getByTestId(EDITOR_TESTID);

		await user.click(editorElement);
		await user.type(editorElement, typed);

		await waitFor(() => {
			expect(richTextOf(editorId)).toContain(`href="${expectedHref}"`);
		});
	});

	it('turns a typed email address into a mailto link', async () => {
		const { editorId, user } = setupEditor();
		const editorElement = screen.getByTestId(EDITOR_TESTID);

		await user.click(editorElement);
		await user.type(editorElement, 'someone@zextras.com ');

		await waitFor(() => {
			expect(richTextOf(editorId)).toContain('href="mailto:someone@zextras.com"');
		});
	});
});
