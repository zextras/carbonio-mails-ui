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

const IMAGE_URL = 'https://example.com/picture.png';
const IMAGE_HTML =
	'<p><img src="https://example.com/inline.png" alt="pic" data-pnsrc="cid:abc@carbonio" /></p>';
const EDITOR_TESTID = 'edit-view-editor';
const INSERT_IMAGE_LABEL = 'lexical-label.insert_image_url';

type TestUser = ReturnType<typeof setupTest>['user'];

function richTextOf(editorId: string): string {
	return useEditorsStore.getState().editors[editorId]?.text.richText ?? '';
}

function setupEditor(richText: string): { editorId: string; user: TestUser } {
	const editor = generateNewMessageEditor();
	editor.text = { plainText: 'pic', richText };
	setupEditorStore({ editors: [editor] });
	const { user } = setupTest(<RichTextEditorContainer editorId={editor.id} onDragOver={vi.fn()} />);
	return { editorId: editor.id, user };
}

describe('ImageModal', () => {
	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('inserts an inline image from the values entered in the modal', async () => {
		const { editorId, user } = setupEditor('<p></p>');

		await user.click(screen.getByTestId(EDITOR_TESTID));
		await user.click(screen.getByRole('button', { name: INSERT_IMAGE_LABEL }));

		expect(await screen.findByText('lexical-label.insert_edit_image')).toBeInTheDocument();
		await user.pasteInto(
			screen.getByRole('textbox', { name: 'lexical-label.image_source' }),
			IMAGE_URL
		);
		await user.pasteInto(
			screen.getByRole('textbox', { name: 'lexical-label.image_alt' }),
			'a picture'
		);
		await user.click(screen.getByRole('button', { name: 'label.save' }));

		await waitFor(() => {
			expect(richTextOf(editorId)).toContain(`src="${IMAGE_URL}"`);
		});
		expect(richTextOf(editorId)).toContain('alt="a picture"');
	});

	it('keeps the save action disabled until a source is provided', async () => {
		const { user } = setupEditor('<p></p>');

		await user.click(screen.getByRole('button', { name: INSERT_IMAGE_LABEL }));

		expect(await screen.findByText('lexical-label.insert_edit_image')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'label.save' })).toBeDisabled();

		await user.pasteInto(
			screen.getByRole('textbox', { name: 'lexical-label.image_source' }),
			IMAGE_URL
		);

		expect(screen.getByRole('button', { name: 'label.save' })).toBeEnabled();
	});

	it('edits a selected image in place when double-clicked', async () => {
		const { editorId, user } = setupEditor(IMAGE_HTML);

		const editorElement = screen.getByTestId(EDITOR_TESTID);
		const image = (await within(editorElement).findByRole('img')) as HTMLImageElement;
		await user.dblClick(image);

		expect(await screen.findByText('lexical-label.insert_edit_image')).toBeInTheDocument();
		expect(screen.getByRole('textbox', { name: 'lexical-label.image_source' })).toHaveValue(
			'https://example.com/inline.png'
		);
		expect(screen.getByRole('textbox', { name: 'lexical-label.image_alt' })).toHaveValue('pic');

		const altInput = screen.getByRole('textbox', { name: 'lexical-label.image_alt' });
		await user.clear(altInput);
		await user.paste('updated alt');
		await user.click(screen.getByRole('button', { name: 'label.save' }));

		await waitFor(() => {
			expect(richTextOf(editorId)).toContain('alt="updated alt"');
		});
	});

	it('keeps the height proportional to the width while the aspect ratio is locked', async () => {
		// Make the loaded image report a fixed 2:1 natural ratio synchronously.
		class MockImage {
			onload: (() => void) | null = null;

			naturalWidth = 400;

			naturalHeight = 200;

			set src(_value: string) {
				this.onload?.();
			}
		}
		vi.stubGlobal('Image', MockImage);

		const { user } = setupEditor('<p></p>');

		await user.click(screen.getByRole('button', { name: INSERT_IMAGE_LABEL }));
		expect(await screen.findByText('lexical-label.insert_edit_image')).toBeInTheDocument();
		await user.pasteInto(
			screen.getByRole('textbox', { name: 'lexical-label.image_source' }),
			IMAGE_URL
		);

		// The natural size pre-fills both dimensions once the source loads.
		const widthInput = screen.getByRole('spinbutton', { name: 'lexical-label.width' });
		await waitFor(() => expect(widthInput).toHaveValue(400));
		expect(screen.getByRole('spinbutton', { name: 'lexical-label.height' })).toHaveValue(200);

		// Editing the width keeps the height proportional (400/200 = 2 -> 100/50).
		await user.clear(widthInput);
		await user.paste('100');

		expect(screen.getByRole('spinbutton', { name: 'lexical-label.height' })).toHaveValue(50);
	});
});
