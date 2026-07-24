/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
/* eslint-disable max-classes-per-file -- two minimal Event stubs cover a jsdom gap (see below) */
import React from 'react';

import { fireEvent, waitFor } from '@testing-library/react';

import { setupTest, screen, within } from '@test-setup';
import { setupEditorStore } from '__test__/generators/editor-store';
import { generateNewMessageEditor } from 'store/editor/editor-generators';
import * as editorStoreIndex from 'store/editor/index';
import { RichTextEditorContainer } from 'views/app/detail-panel/edit/editor/parts/rich-text-editor-container';

const EDITOR_TESTID = 'edit-view-editor';

type AddInlineAttachments = ReturnType<
	typeof editorStoreIndex.useEditorAttachments
>['addInlineAttachments'];

type FakeClipboardItem = {
	kind: string;
	type: string;
	getAsFile: () => File | null;
};

const PLAIN_TEXT = 'text/plain';
const HTML = 'text/html';

// jsdom (20) implements neither DragEvent nor ClipboardEvent, yet Lexical's
// default paste handler does `instanceof` checks against both. Two distinct
// no-op Event subclasses stand in so the checks resolve (rather than throwing a
// ReferenceError) and the synthetic paste event is classified as a clipboard
// paste, not a drag.
class StubDragEvent extends Event {}
class StubClipboardEvent extends Event {}

/**
 * Replaces `useEditorAttachments` so the paste handler's upload step resolves
 * synchronously with a ready-to-insert inline attachment.
 */
function mockEditorAttachments(addInlineAttachments: AddInlineAttachments): void {
	vi.spyOn(editorStoreIndex, 'useEditorAttachments').mockReturnValue({
		addInlineAttachments,
		keepOnlyInlineAttachments: vi.fn(),
		addStandardAttachments: vi.fn(),
		addUploadedAttachment: vi.fn()
	} as unknown as ReturnType<typeof editorStoreIndex.useEditorAttachments>);
}

function renderEditor(): void {
	const editor = generateNewMessageEditor();
	editor.text = { plainText: '', richText: '<p></p>' };
	setupEditorStore({ editors: [editor] });
	setupTest(<RichTextEditorContainer editorId={editor.id} onDragOver={vi.fn()} />);
}

/**
 * Dispatches a synthetic paste event with a hand-built clipboard payload, since
 * jsdom cannot represent files on a real `DataTransfer` / `userEvent.paste`.
 */
function pasteInto(
	target: HTMLElement,
	items: Array<FakeClipboardItem>,
	text = '',
	html = ''
): void {
	const types = [text && PLAIN_TEXT, html && HTML].filter((type): type is string => Boolean(type));
	// eslint-disable-next-line testing-library/prefer-user-event
	fireEvent.paste(target, {
		clipboardData: {
			items,
			files: [],
			getData: (type: string): string => {
				if (type === PLAIN_TEXT) return text;
				if (type === HTML) return html;
				return '';
			},
			types
		}
	});
}

describe('PastePlugin', () => {
	const globalScope = globalThis as Record<string, unknown>;
	const originalDragEvent = globalScope.DragEvent;
	const originalClipboardEvent = globalScope.ClipboardEvent;
	beforeAll(() => {
		globalScope.DragEvent = originalDragEvent ?? StubDragEvent;
		globalScope.ClipboardEvent = originalClipboardEvent ?? StubClipboardEvent;
	});
	afterAll(() => {
		globalScope.DragEvent = originalDragEvent;
		globalScope.ClipboardEvent = originalClipboardEvent;
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('uploads pasted image files and inserts them as inline images', async () => {
		const file = new File(['x'], 'pic.png', { type: 'image/png' });
		const addInlineAttachments = vi.fn((_files, { onSaveComplete }) => {
			onSaveComplete([
				{ downloadServiceUrl: 'https://service/pasted.png', cidUrl: 'cid:pasted@carbonio' }
			]);
		}) as unknown as AddInlineAttachments;
		mockEditorAttachments(addInlineAttachments);

		renderEditor();
		const editorElement = screen.getByTestId(EDITOR_TESTID);

		pasteInto(editorElement, [{ kind: 'file', type: 'image/png', getAsFile: (): File => file }]);

		expect(addInlineAttachments).toHaveBeenCalledTimes(1);
		expect(addInlineAttachments).toHaveBeenCalledWith([file], expect.anything());

		const image = await within(editorElement).findByRole('img');
		expect(image).toHaveAttribute('src', 'https://service/pasted.png');
	});

	it('ignores text-only paste and lets the default handler deal with it', async () => {
		const addInlineAttachments = vi.fn() as unknown as AddInlineAttachments;
		mockEditorAttachments(addInlineAttachments);

		renderEditor();
		const editorElement = screen.getByTestId(EDITOR_TESTID);

		pasteInto(
			editorElement,
			[{ kind: 'string', type: 'text/plain', getAsFile: (): null => null }],
			'just text'
		);

		// No image upload was attempted and no inline image was inserted.
		await waitFor(() => {
			expect(addInlineAttachments).not.toHaveBeenCalled();
		});
		expect(within(editorElement).queryByRole('img')).not.toBeInTheDocument();
	});

	it('prefers the HTML table over the flattened image snapshot when pasting from Excel/Pages', async () => {
		// Copying a table out of Excel, Pages, Word etc. puts both a real HTML
		// table and a flattened image snapshot of the same selection on the
		// clipboard, for apps that can't handle rich paste. This must let the
		// HTML through to the default handler instead of uploading the image.
		const file = new File(['x'], 'snapshot.png', { type: 'image/png' });
		const addInlineAttachments = vi.fn() as unknown as AddInlineAttachments;
		mockEditorAttachments(addInlineAttachments);

		renderEditor();
		const editorElement = screen.getByTestId(EDITOR_TESTID);

		pasteInto(
			editorElement,
			[{ kind: 'file', type: 'image/png', getAsFile: (): File => file }],
			'Header\tValue',
			'<table><tr><td>Header</td><td>Value</td></tr></table>'
		);

		await waitFor(() => {
			expect(addInlineAttachments).not.toHaveBeenCalled();
		});
		expect(within(editorElement).queryByRole('img')).not.toBeInTheDocument();
	});
});
