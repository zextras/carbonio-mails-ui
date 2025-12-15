// noinspection HtmlRequiredAltAttribute

/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { RichTextEditorContainer } from '../rich-text-editor-container';
import { setupTest, screen } from '@test-setup';
import { handleEditorPaste } from 'views/app/detail-panel/edit/parts/editor-paste-handler';

let editorInstance: any = null;

// FIXME: check actual content in the editor, avoid spy
describe.skip('RichTextEditorContainer', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.resetAllMocks();
		editorInstance = null;
	});

	test('cleans up inline attachments that are no longer in content', async () => {
		setupTest(<RichTextEditorContainer editorId="editor-1" onDragOver={vi.fn()} />);
		await screen.findByTestId('mock-composer');

		editorInstance?.setContent(
			'<p><img pnsrc="cid:first" src="cid:first" />' +
				'<img src="cid:second" />' +
				'<img src="https://test.test/image.png" /></p>'
		);

		editorInstance?.dispatch('input');
		// fast-forward debounce timer
		vi.runAllTimers();

		// expect(mockRemoveInlineAttachments).toHaveBeenCalledWith(['cid:first', 'cid:second']);
	});

	test('handles paste event and restores scroll position', async () => {
		setupTest(<RichTextEditorContainer editorId="editor-1" onDragOver={vi.fn()} />);
		await screen.findByTestId('mock-composer');

		const editWrapper = document.createElement('div');
		editWrapper.dataset.testid = 'edit-view-editor';
		const parent = document.createElement('div');
		parent.scrollTop = 42;
		parent.appendChild(editWrapper);
		document.body.appendChild(parent);

		const event = {} as unknown as ClipboardEvent;

		editorInstance.dispatch('paste', event);

		expect(handleEditorPaste).toHaveBeenCalledWith(editorInstance, 'editor-1', event);
		expect(parent.scrollTop).toBe(42);
	});

	test('cleanupUnusedAttachments removes only used inline attachments in real component', async () => {
		vi.useFakeTimers();

		setupTest(<RichTextEditorContainer editorId="editor-1" onDragOver={vi.fn()} />);
		await screen.findByTestId('mock-composer');

		editorInstance?.setContent(
			'<p>' +
				'<img data-pnsrc="cid:first" src="cid:first" />' +
				'<img src="cid:second" />' +
				'<img src="https://test.test/image.png" />' +
				'</p>'
		);

		editorInstance?.dispatch('input');

		vi.runAllTimers();

		// expect(mockRemoveInlineAttachments).toHaveBeenCalledWith(['cid:first', 'cid:second']);
	});
});
