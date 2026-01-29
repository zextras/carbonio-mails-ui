/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { page } from '@vitest/browser/context';

import { generateMessage } from '../../../../../../__test__/generators/generateMessage';
import { useEditorsStore } from '../../../../../../store/editor';
import { generateReplyMsgEditor } from '../../../../../../store/editor/editor-generators';
import { FolderPanelRouteParams } from '../../../../../../types/routes';
import { RichTextEditorContainer } from '../rich-text-editor-container';
import { renderInBrowser } from '@browser-test-utils/setup-in-browser';

vi.mock('react-router-dom', async () => ({
	...(await vi.importActual('react-router-dom')),
	useParams: (): FolderPanelRouteParams => ({
		folderId: '2'
	})
}));

describe('rich-text-editor-container', () => {
	it('should display body of message replied to in editor', async () => {
		const message = generateMessage({
			body: '<p>Hello, World!</p>'
		});
		const editor = generateReplyMsgEditor(message);
		useEditorsStore.getState().addEditor(editor.id, editor);

		await renderInBrowser(<RichTextEditorContainer editorId={editor.id} onDragOver={vi.fn()} />);

		const frame = page.frameLocator(page.getByTitle('Rich Text Area'));
		await expect.element(frame.getByText('Hello, World!')).toBeVisible();
	});
});
